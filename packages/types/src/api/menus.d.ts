export type MenuType = 'DIRECTORY' | 'PAGE'
export type PermissionHttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'

export interface ApiPermissionRule {
  httpMethod: PermissionHttpMethod
  /** Relative to /api; must exactly match a registered route template. */
  path: string
}

export interface MenuInput {
  parentId: string | null
  menuType: MenuType
  name: string
  permissionCode: string
  /** 可留空；导航仍可展示，路由和组件均配置后才支持跳转。 */
  routePath: string | null
  /** 可留空，表示暂不绑定页面组件。 */
  componentKey: string | null
  icon: string | null
  sortOrder: number
  visible: boolean
  enabled: boolean
}

export interface MenuActionInput {
  menuId: string
  name: string
  permissionCode: string
  sortOrder: number
  enabled: boolean
  rules: ApiPermissionRule[]
}

export interface MenuActionItem extends MenuActionInput {
  actionId: string
  createTime: string
  updateTime: string
}

export interface MenuItem extends MenuInput {
  menuId: string
  createTime: string
  updateTime: string
  actions: MenuActionItem[]
  children: MenuItem[]
}

export interface RolePermissions {
  roleId: string
  menuIds: string[]
  actionIds: string[]
  /** Optimistic concurrency token for configuration and grants. */
  revision: string
  isSystem: boolean
}

export interface AssignRolePermissionsRequest {
  roleId: string
  menuIds: string[]
  actionIds: string[]
  revision: string
}

export interface AuthorizedMenu extends MenuInput {
  menuId: string
  children: AuthorizedMenu[]
}

export interface CurrentAuthorization {
  revision: string
  isSuperAdmin: boolean
  menus: AuthorizedMenu[]
  permissions: string[]
}
