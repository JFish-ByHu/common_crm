import { request } from '../core'
import type { ApiRequestConfig, ApiResponse } from '../types'

import type {
  DeleteCountResponse,
  UpdateRoleStatusRequest,
  DeleteRoleRequest,
  BatchDeleteRolesRequest,
  AssignUserRolesRequest,
  RoleSelectItem,
  RoleListItem,
  QueryRoleListRequest,
  RoleListResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
  UserRolesResponse
} from '@common-crm/types/api'
export type {
  RoleStatus,
  RoleSelectItem,
  RoleListItem,
  QueryRoleListRequest,
  RoleListResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
  UserRolesResponse,
  UpdateRoleStatusRequest,
  DeleteRoleRequest,
  BatchDeleteRolesRequest,
  AssignUserRolesRequest
} from '@common-crm/types/api'

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

export const updateRoleStatus = (
  data: UpdateRoleStatusRequest
): Promise<ApiResponse<RoleListItem>> =>
  request<RoleListItem>({ url: '/roles/updateRoleStatus', method: 'patch', data })

export const deleteRole = (data: DeleteRoleRequest): Promise<ApiResponse<DeleteCountResponse>> =>
  request<DeleteCountResponse>({ url: '/roles/delete', method: 'delete', data })

export const batchDeleteRoles = (
  data: BatchDeleteRolesRequest
): Promise<ApiResponse<DeleteCountResponse>> =>
  request<DeleteCountResponse>({ url: '/roles/batchDelete', method: 'delete', data })

export const queryUserRoles = (
  userId: string,
  config: QueryConfig = {}
): Promise<ApiResponse<UserRolesResponse>> =>
  request<UserRolesResponse>({ ...config, url: '/users/roles', method: 'get', params: { userId } })

/** 完整替换用户的角色集合；空数组解除全部分配。 */
export const assignUserRoles = (
  data: AssignUserRolesRequest
): Promise<ApiResponse<UserRolesResponse>> =>
  request<UserRolesResponse>({ url: '/users/assignRoles', method: 'patch', data })
