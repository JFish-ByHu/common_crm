import type { OptionalPageRequest, PageResponse } from './common.js'

export type RoleStatus = 0 | 1
export interface RoleSelectItem {
  roleId: string
  roleName: string
  roleCode: string
  roleStatus: RoleStatus
  isSystem: boolean
}
export interface RoleListItem extends RoleSelectItem {
  remark: string | null
  memberCount: number
  createTime: string
  updateTime: string
}
export interface QueryRoleListRequest extends OptionalPageRequest {
  keyword?: string
  roleStatus?: RoleStatus
}
export type RoleListResponse<T = RoleListItem> = PageResponse<T>
export interface CreateRoleRequest {
  roleName: string
  roleCode: string
  roleStatus?: RoleStatus
  remark?: string | null
}
export interface UpdateRoleRequest {
  roleId: string
  roleName?: string
  roleStatus?: RoleStatus
  remark?: string | null
}
export interface UserRolesResponse {
  userId: string
  roles: RoleSelectItem[]
}

export interface UpdateRoleStatusRequest {
  roleId: string
  roleStatus: RoleStatus
}
export interface DeleteRoleRequest {
  roleId: string
}
export interface BatchDeleteRolesRequest {
  roleIds: string[]
}
export interface AssignUserRolesRequest {
  userId: string
  roleIds: string[]
}
