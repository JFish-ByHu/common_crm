import { MenuErrors } from '@common-crm/errors'
import { Injectable } from '@nestjs/common'
import type {
  AssignRolePermissionsRequest,
  MenuActionInput,
  MenuInput,
  MenuItem,
  RolePermissions
} from '@common-crm/types/api'
import { formatApiDateTime } from '../../../common'
import { EndpointCatalogService } from '../../authorization'
import { MenusRepository } from '../repositories'
import { rejectPermissionInput } from '../menus.error'

@Injectable()
export class MenusService {
  constructor(
    private readonly repository: MenusRepository,
    private readonly endpoints: EndpointCatalogService
  ) {}

  async findTree(): Promise<MenuItem[]> {
    const records = await this.repository.findAll()
    const nodes = new Map<string, MenuItem>(
      records.map(({ actions, ...menu }) => [
        menu.menuId,
        {
          ...menu,
          menuType: menu.menuType as MenuItem['menuType'],
          createTime: formatApiDateTime(menu.createTime),
          updateTime: formatApiDateTime(menu.updateTime),
          children: [],
          actions: actions.map(({ rules, ...action }) => ({
            ...action,
            createTime: formatApiDateTime(action.createTime),
            updateTime: formatApiDateTime(action.updateTime),
            rules: rules.map(rule => ({
              httpMethod: rule.httpMethod as MenuActionInput['rules'][number]['httpMethod'],
              path: rule.path
            }))
          }))
        }
      ])
    )
    const roots: MenuItem[] = []
    for (const node of nodes.values()) {
      if (node.parentId) nodes.get(node.parentId)?.children.push(node)
      else roots.push(node)
    }
    return roots
  }

  async findActions(menuId: string) {
    const menu = (await this.repository.findAll()).find(item => item.menuId === menuId)
    if (!menu) return rejectPermissionInput(MenuErrors.MENU_NOT_FOUND)
    return menu.actions.map(({ rules, ...action }) => ({
      ...action,
      createTime: formatApiDateTime(action.createTime),
      updateTime: formatApiDateTime(action.updateTime),
      rules: rules.map(rule => ({ httpMethod: rule.httpMethod, path: rule.path }))
    }))
  }

  async saveMenu(input: MenuInput, actorId: string, menuId?: string) {
    if (input.menuType === 'PAGE') {
      const path = input.routePath
      if (path?.endsWith('/')) rejectPermissionInput(MenuErrors.TRAILING_SLASH)
      const parameters = path?.split('/').filter(part => part.startsWith(':')) ?? []
      if (parameters.length !== new Set(parameters).size)
        rejectPermissionInput(MenuErrors.DUPLICATE_PARAMETER)
      if (parameters.length && input.visible)
        rejectPermissionInput(MenuErrors.PARAMETER_PAGE_VISIBLE)
      if (path && !/^\/(system|customer)(\/|$)/.test(path))
        rejectPermissionInput(MenuErrors.INVALID_APP_PATH)
      if (path && (/\/access-denied(\/|$)/.test(path) || path === '/system'))
        rejectPermissionInput(MenuErrors.RESERVED_ROUTE)
      const base = input.componentKey ? '/' + input.componentKey.split('-')[0] : null
      if (path && base && path !== base && !path.startsWith(base + '/'))
        rejectPermissionInput(MenuErrors.COMPONENT_APP_MISMATCH)
    } else if (input.componentKey || input.routePath)
      rejectPermissionInput(MenuErrors.DIRECTORY_HAS_PAGE)
    await this.repository.saveMenu(input, actorId, menuId, !menuId)
    return null
  }

  deleteMenus(menuIds: string[], actorId: string) {
    return this.repository.deleteMenus(menuIds, actorId)
  }

  saveAction(input: MenuActionInput, actorId: string, actionId?: string) {
    if (input.rules.some(rule => !this.endpoints.contains(rule)))
      rejectPermissionInput(MenuErrors.UNKNOWN_ENDPOINT)
    const keys = input.rules.map(rule => `${rule.httpMethod} ${rule.path}`)
    if (new Set(keys).size !== keys.length) rejectPermissionInput(MenuErrors.DUPLICATE_ENDPOINT)
    return this.repository.saveAction(input, actorId, actionId, !actionId)
  }

  deleteAction(actionId: string, actorId: string) {
    return this.repository.deleteAction(actionId, actorId)
  }
  findEndpoints() {
    return this.endpoints.list()
  }
  findRolePermissions(roleId: string): Promise<RolePermissions> {
    return this.repository.findRolePermissions(roleId)
  }
  assignPermissions(input: AssignRolePermissionsRequest, actorId: string) {
    return this.repository.assignPermissions(input, actorId)
  }
}
