import { request } from '../core'
import type { ApiRequestConfig, ApiResponse, PageRequest } from '../types'

export type RoleStatus = 0 | 1
export interface RoleSelectItem {
  roleId: string
  roleName: string
  roleCode: string
  roleStatus: RoleStatus
}
export interface RoleListItem extends RoleSelectItem {
  remark: string | null
  memberCount: number
  createTime: string
  updateTime: string
}
export interface QueryRoleListRequest extends Partial<PageRequest> {
  keyword?: string
  roleStatus?: RoleStatus
}
export interface RoleListResponse<T = RoleListItem> {
  list: T[]
  total: number
  page: number | null
  pageSize: number | null
}
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
type QueryConfig = Pick<ApiRequestConfig, 'signal' | 'showProgress'>

/** 不传分页参数时查询全部角色。 */
export const queryRoleList = (
  params: QueryRoleListRequest = {},
  config: QueryConfig = {}
): Promise<ApiResponse<RoleListResponse>> =>
  request<RoleListResponse>({ ...config, url: '/roles/list', method: 'get', params })

export const queryRoleSelectList = (
  params: QueryRoleListRequest = {},
  config: QueryConfig = {}
): Promise<ApiResponse<RoleListResponse<RoleSelectItem>>> =>
  request<RoleListResponse<RoleSelectItem>>({
    ...config,
    url: '/roles/selectList',
    method: 'get',
    params
  })

export const queryRoleDetail = (
  roleId: string,
  config: QueryConfig = {}
): Promise<ApiResponse<RoleListItem>> =>
  request<RoleListItem>({ ...config, url: '/roles/detail', method: 'get', params: { roleId } })

export const createRole = (data: CreateRoleRequest): Promise<ApiResponse<RoleListItem>> =>
  request<RoleListItem, CreateRoleRequest>({ url: '/roles/create', method: 'post', data })

export const updateRole = (data: UpdateRoleRequest): Promise<ApiResponse<RoleListItem>> =>
  request<RoleListItem, UpdateRoleRequest>({ url: '/roles/update', method: 'patch', data })

export const updateRoleStatus = (data: {
  roleId: string
  roleStatus: RoleStatus
}): Promise<ApiResponse<RoleListItem>> =>
  request<RoleListItem>({ url: '/roles/updateRoleStatus', method: 'patch', data })

export const deleteRole = (data: {
  roleId: string
}): Promise<ApiResponse<{ deletedCount: number }>> =>
  request<{ deletedCount: number }>({ url: '/roles/delete', method: 'delete', data })

export const batchDeleteRoles = (data: {
  roleIds: string[]
}): Promise<ApiResponse<{ deletedCount: number }>> =>
  request<{ deletedCount: number }>({ url: '/roles/batchDelete', method: 'delete', data })

export const queryUserRoles = (
  userId: string,
  config: QueryConfig = {}
): Promise<ApiResponse<UserRolesResponse>> =>
  request<UserRolesResponse>({ ...config, url: '/users/roles', method: 'get', params: { userId } })

/** 完整替换用户的角色集合；空数组解除全部分配。 */
export const assignUserRoles = (data: {
  userId: string
  roleIds: string[]
}): Promise<ApiResponse<UserRolesResponse>> =>
  request<UserRolesResponse>({ url: '/users/assignRoles', method: 'patch', data })
