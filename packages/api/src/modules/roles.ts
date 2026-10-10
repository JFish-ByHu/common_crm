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
import { request } from '../core'
import type { ApiQueryConfig, ApiResponse } from '../types'

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

/** 不传分页参数时查询全部角色。 */
export const queryRoleList = (
  params: QueryRoleListRequest = {},
  config: ApiQueryConfig = {}
): Promise<ApiResponse<RoleListResponse>> =>
  request<RoleListResponse>({
    ...config,
    url: '/roles/list',
    method: 'get',
    params
  })

/** 查询角色下拉选项。 */
export const queryRoleSelectList = (
  params: QueryRoleListRequest = {},
  config: ApiQueryConfig = {}
): Promise<ApiResponse<RoleListResponse<RoleSelectItem>>> =>
  request<RoleListResponse<RoleSelectItem>>({
    ...config,
    url: '/roles/selectList',
    method: 'get',
    params
  })

/** 查询角色详情。 */
export const queryRoleDetail = (
  roleId: string,
  config: ApiQueryConfig = {}
): Promise<ApiResponse<RoleListItem>> =>
  request<RoleListItem>({
    ...config,
    url: '/roles/detail',
    method: 'get',
    params: { roleId }
  })

/** 创建角色。 */
export const createRole = (data: CreateRoleRequest): Promise<ApiResponse<RoleListItem>> =>
  request<RoleListItem, CreateRoleRequest>({
    url: '/roles/create',
    method: 'post',
    data
  })

/** 编辑角色。 */
export const updateRole = (data: UpdateRoleRequest): Promise<ApiResponse<RoleListItem>> =>
  request<RoleListItem, UpdateRoleRequest>({
    url: '/roles/update',
    method: 'patch',
    data
  })

/** 更改角色启用状态。 */
export const updateRoleStatus = (
  data: UpdateRoleStatusRequest
): Promise<ApiResponse<RoleListItem>> =>
  request<RoleListItem, UpdateRoleStatusRequest>({
    url: '/roles/updateRoleStatus',
    method: 'patch',
    data
  })

/** 删除单个角色，参数通过 JSON 请求体提交。 */
export const deleteRole = (data: DeleteRoleRequest): Promise<ApiResponse<DeleteCountResponse>> =>
  request<DeleteCountResponse, DeleteRoleRequest>({
    url: '/roles/delete',
    method: 'delete',
    data
  })

/** 批量删除角色，参数通过 JSON 请求体提交。 */
export const batchDeleteRoles = (
  data: BatchDeleteRolesRequest
): Promise<ApiResponse<DeleteCountResponse>> =>
  request<DeleteCountResponse, BatchDeleteRolesRequest>({
    url: '/roles/batchDelete',
    method: 'delete',
    data
  })

/** 查询用户已分配的角色。 */
export const queryUserRoles = (
  userId: string,
  config: ApiQueryConfig = {}
): Promise<ApiResponse<UserRolesResponse>> =>
  request<UserRolesResponse>({
    ...config,
    url: '/users/roles',
    method: 'get',
    params: { userId }
  })

/** 完整替换用户的角色集合；空数组解除全部分配。 */
export const assignUserRoles = (
  data: AssignUserRolesRequest
): Promise<ApiResponse<UserRolesResponse>> =>
  request<UserRolesResponse, AssignUserRolesRequest>({
    url: '/users/assignRoles',
    method: 'patch',
    data
  })
