import type { OptionalPageRequest, PageResponse, DeleteCountResponse } from './common.js'
import type { RoleSelectItem } from './roles.js'
import type { MenuType } from './menus.js'

export type UserAccountStatus = 0 | 1

/** 0 离线、1 在线、null 暂时无法确定。 */
export type UserOnlineStatus = 0 | 1 | null

export interface UserPresenceItem {
  userId: string
  onlineStatus: UserOnlineStatus
}

export interface UserSelectItem {
  userId: string
  username: string
  accountStatus: UserAccountStatus
}

export interface UserListItem extends UserSelectItem {
  /** 已分配角色，包含停用角色。 */
  roles: RoleSelectItem[]
  email: string | null
  onlineStatus: UserOnlineStatus
  /** 中国标准时间，格式为 yyyy-MM-dd HH:mm:ss。 */
  createTime: string
  /** 中国标准时间，格式为 yyyy-MM-dd HH:mm:ss。 */
  updateTime: string
}

export interface QueryUserListRequest extends OptionalPageRequest {
  /** 匹配用户 ID、用户名或邮箱。 */
  keyword?: string
  accountStatus?: UserAccountStatus
}

export interface QueryUserSelectListRequest extends OptionalPageRequest {
  username?: string
}

export type UserListResponse<T = UserListItem> = PageResponse<T>

export interface CreateUserRequest {
  username: string
  password: string
  email?: string | null
  accountStatus?: UserAccountStatus
}

export interface UpdateUserRequest {
  userId: string
  username?: string
  email?: string | null
  password?: string
  accountStatus?: UserAccountStatus
}

export interface UpdateUserAccountStatusRequest {
  userId: string
  accountStatus: UserAccountStatus
}

export interface DeleteUserRequest {
  userId: string
}

export interface BatchDeleteUsersRequest {
  userIds: string[]
}

export type DeleteUsersResponse = DeleteCountResponse

export interface LogoutUserResponse {
  revokedCount: number
}

export interface UserPermissionAction {
  actionId: string
  name: string
  permissionCode: string
  sourceRoles: RoleSelectItem[]
}

export interface UserPermissionMenu {
  menuId: string
  menuType: MenuType
  name: string
  permissionCode: string
  routePath: string | null
  visible: boolean
  sourceRoles: RoleSelectItem[]
  actions: UserPermissionAction[]
  children: UserPermissionMenu[]
}

/** 查询时实时计算；停用账号的有效菜单为空，已分配角色仍保留展示。 */
export interface UserPermissionsResponse extends UserSelectItem {
  revision: string
  isSuperAdmin: boolean
  roles: RoleSelectItem[]
  menus: UserPermissionMenu[]
}
