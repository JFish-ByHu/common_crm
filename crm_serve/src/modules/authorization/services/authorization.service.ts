import { ForbiddenException, Injectable } from '@nestjs/common'
import type {
  AuthorizedMenu,
  CurrentAuthorization,
  PermissionHttpMethod
} from '@common-crm/types/api'
import { Result, StatusCode } from '../../../common'
import { RedisService } from '../../../database'
import { AuthorizationRepository } from '../repositories'
import { endpointKey, type AuthorizationSnapshot } from '../types'

@Injectable()
export class AuthorizationService {
  private readonly pending = new Map<string, Promise<AuthorizationSnapshot>>()

  constructor(
    private readonly repository: AuthorizationRepository,
    private readonly redis: RedisService
  ) {}

  async current(userId: string): Promise<CurrentAuthorization> {
    const snapshot = await this.snapshot(userId)
    return {
      revision: snapshot.revision,
      isSuperAdmin: snapshot.isSuperAdmin,
      menus: snapshot.menus,
      permissions: snapshot.permissions
    }
  }

  async assertAllowed(userId: string, httpMethod: string, path: string) {
    const snapshot = await this.snapshot(userId)
    if (
      snapshot.isSuperAdmin ||
      snapshot.endpoints.some(rule => endpointKey(rule) === `${httpMethod} ${path}`)
    )
      return
    throw new ForbiddenException(Result.failure(StatusCode.NO_PERMISSION, null, '没有该操作的权限'))
  }

  private async snapshot(userId: string): Promise<AuthorizationSnapshot> {
    // Read the database revision even on cache hits: a Redis failure cannot retain revoked grants.
    const revision = await this.repository.findRevision()
    const key = `${this.redis.keyPrefix}:authz:${revision}:${userId}`
    const pending = this.pending.get(key)
    if (pending) return pending
    const operation = this.loadSnapshot(userId, revision, key)
    this.pending.set(key, operation)
    try {
      return await operation
    } finally {
      this.pending.delete(key)
    }
  }

  private async loadSnapshot(
    userId: string,
    revision: string,
    key: string
  ): Promise<AuthorizationSnapshot> {
    const cached = await this.redis.execute(client => client.get(key))
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as AuthorizationSnapshot
        if (
          parsed.revision === revision &&
          Array.isArray(parsed.endpoints) &&
          Array.isArray(parsed.menus) &&
          Array.isArray(parsed.permissions) &&
          typeof parsed.isSuperAdmin === 'boolean'
        )
          return parsed
      } catch {
        /* Rebuild malformed cache entries from the authoritative database. */
      }
    }
    const { menus, roles } = await this.repository.findUserPermissions(userId)
    const isSuperAdmin = roles.some(role => role.isSystem)
    const menuIds = new Set(roles.flatMap(role => role.menus.map(item => item.menuId)))
    const actionIds = new Set(roles.flatMap(role => role.actions.map(item => item.actionId)))
    const activeIds = new Set<string>()
    const isActive = (menuId: string, visited = new Set<string>()): boolean => {
      if (activeIds.has(menuId)) return true
      if (visited.has(menuId)) return false
      visited.add(menuId)
      const menu = menus.find(item => item.menuId === menuId)
      if (!menu?.enabled || (!isSuperAdmin && !menuIds.has(menuId))) return false
      if (menu.parentId && !isActive(menu.parentId, visited)) return false
      activeIds.add(menuId)
      return true
    }
    const activeMenus = menus.filter(menu => isActive(menu.menuId))
    const nodes = new Map<string, AuthorizedMenu>(
      activeMenus.map(menu => [
        menu.menuId,
        {
          menuId: menu.menuId,
          parentId: menu.parentId,
          menuType: menu.menuType as AuthorizedMenu['menuType'],
          name: menu.name,
          permissionCode: menu.permissionCode,
          routePath: menu.routePath,
          componentKey: menu.componentKey,
          icon: menu.icon,
          sortOrder: menu.sortOrder,
          visible: menu.visible,
          enabled: menu.enabled,
          children: []
        }
      ])
    )
    const tree: AuthorizedMenu[] = []
    for (const node of nodes.values()) {
      if (node.parentId) nodes.get(node.parentId)?.children.push(node)
      else tree.push(node)
    }
    const grantedActions = activeMenus.flatMap(menu =>
      menu.actions
        .filter(action => action.enabled && (isSuperAdmin || actionIds.has(action.actionId)))
        .map(action => ({ menu, action }))
    )
    const result: AuthorizationSnapshot = {
      revision,
      isSuperAdmin,
      menus: tree,
      permissions: [
        ...activeMenus.map(menu => menu.permissionCode),
        ...grantedActions.map(({ action }) => action.permissionCode)
      ],
      endpoints: grantedActions.flatMap(({ action }) =>
        action.rules.map(rule => ({
          httpMethod: rule.httpMethod as PermissionHttpMethod,
          path: rule.path
        }))
      )
    }
    await this.redis.execute(client => client.set(key, JSON.stringify(result), 'EX', 120))
    return result
  }
}
