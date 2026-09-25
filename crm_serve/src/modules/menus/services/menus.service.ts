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
    if (!menu) return rejectPermissionInput('菜单不存在', 404)
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
      if (path?.endsWith('/')) rejectPermissionInput('路由路径不能以斜杠结尾')
      const parameters = path?.split('/').filter(part => part.startsWith(':')) ?? []
      if (parameters.length !== new Set(parameters).size)
        rejectPermissionInput('路由参数名不能重复')
      if (parameters.length && input.visible)
        rejectPermissionInput('包含动态参数的页面必须隐藏导航')
      if (path && !/^\/(system|customer)(\/|$)/.test(path))
        rejectPermissionInput('页面路由必须位于 /system 或 /customer 下')
      if (path && (/\/access-denied(\/|$)/.test(path) || path === '/system'))
        rejectPermissionInput('不能占用应用保留路由')
      const base = input.componentKey ? '/' + input.componentKey.split('-')[0] : null
      if (path && base && path !== base && !path.startsWith(base + '/'))
        rejectPermissionInput('组件与所属应用路由不一致')
    } else if (input.componentKey || input.routePath)
      rejectPermissionInput('目录不绑定页面组件和路由')
    await this.repository.saveMenu(input, actorId, menuId, !menuId)
    return null
  }

  deleteMenus(menuIds: string[], actorId: string) {
    return this.repository.deleteMenus(menuIds, actorId)
  }

  saveAction(input: MenuActionInput, actorId: string, actionId?: string) {
    if (input.rules.some(rule => !this.endpoints.contains(rule)))
      rejectPermissionInput('包含不存在或不允许配置的接口')
    const keys = input.rules.map(rule => `${rule.httpMethod} ${rule.path}`)
    if (new Set(keys).size !== keys.length) rejectPermissionInput('接口不能重复绑定')
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
