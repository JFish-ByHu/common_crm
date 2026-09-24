import { request } from '../core'
import type { ApiRequestConfig, ApiResponse } from '../types'

import type {
  UserPresenceItem,
  UserSelectItem,
  UserListItem,
  UserPermissionsResponse,
  QueryUserListRequest,
  QueryUserSelectListRequest,
  UserListResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserAccountStatusRequest,
  DeleteUserRequest,
  BatchDeleteUsersRequest,
  DeleteUsersResponse,
  LogoutUserResponse
} from '@common-crm/types/api'
export type {
  UserAccountStatus,
  UserOnlineStatus,
  UserPresenceItem,
  UserSelectItem,
  UserListItem,
  UserPermissionsResponse,
  QueryUserListRequest,
  QueryUserSelectListRequest,
  UserListResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserAccountStatusRequest,
  DeleteUserRequest,
  BatchDeleteUsersRequest,
  DeleteUsersResponse,
  LogoutUserResponse
} from '@common-crm/types/api'

type UserQueryConfig = Pick<ApiRequestConfig, 'signal' | 'showProgress'>

/** 按需查询指定用户的有效菜单、按钮权限及角色来源。 */
export const queryUserPermissions = (userId: string, config: UserQueryConfig = {}) =>
  request<UserPermissionsResponse>({
    ...config,
    url: '/users/permissions',
    method: 'get',
    params: { userId }
  })

/** 查询最多 100 个用户的在线状态；不存在的用户不返回。 */
export const queryUsersOnlineStatus = (
  userIds: string[],
  config: Pick<ApiRequestConfig, 'signal'> = {}
): Promise<ApiResponse<UserPresenceItem[]>> =>
  request<UserPresenceItem[]>({
    ...config,
    url: '/users/onlineStatus',
    method: 'get',
    params: { userIds: [...new Set(userIds)].join(',') },
    timeout: 5000,
    showProgress: false
  })

/** 查询用户列表；省略 page 和 pageSize 时返回全部匹配用户。 */
export const queryUserList = (
  params: QueryUserListRequest = {},
  config: UserQueryConfig = {}
): Promise<ApiResponse<UserListResponse>> =>
  request<UserListResponse>({ ...config, url: '/users/list', method: 'get', params })

/** 查询用户下拉选项；仅返回 userId、username、accountStatus。 */
export const queryUserSelectList = (
  params: QueryUserSelectListRequest = {},
  config: UserQueryConfig = {}
): Promise<ApiResponse<UserListResponse<UserSelectItem>>> =>
  request<UserListResponse<UserSelectItem>>({
    ...config,
    url: '/users/selectList',
    method: 'get',
    params
  })

/** 创建用户。 */
export const createUser = (data: CreateUserRequest): Promise<ApiResponse<UserListItem>> =>
  request<UserListItem, CreateUserRequest>({ url: '/users/create', method: 'post', data })

/** 编辑用户资料和账号状态；重设密码或停用账号会撤销该用户的登录会话。 */
export const updateUser = (data: UpdateUserRequest): Promise<ApiResponse<UserListItem>> =>
  request<UserListItem, UpdateUserRequest>({ url: '/users/update', method: 'patch', data })

/** 更改账号状态；停用账号会撤销该用户的登录会话。 */
export const updateUserAccountStatus = (
  data: UpdateUserAccountStatusRequest
): Promise<ApiResponse<UserListItem>> =>
  request<UserListItem, UpdateUserAccountStatusRequest>({
    url: '/users/updateAccountStatus',
    method: 'patch',
    data
  })

/** 删除单个用户，参数通过 JSON 请求体提交。 */
export const deleteUser = (data: DeleteUserRequest): Promise<ApiResponse<DeleteUsersResponse>> =>
  request<DeleteUsersResponse, DeleteUserRequest>({
    url: '/users/delete',
    method: 'delete',
    data
  })

/** 批量删除用户，参数通过 JSON 请求体提交。 */
export const batchDeleteUsers = (
  data: BatchDeleteUsersRequest
): Promise<ApiResponse<DeleteUsersResponse>> =>
  request<DeleteUsersResponse, BatchDeleteUsersRequest>({
    url: '/users/batchDelete',
    method: 'delete',
    data
  })

/** 强制指定用户退出全部登录会话。 */
export const logoutUser = (data: DeleteUserRequest): Promise<ApiResponse<LogoutUserResponse>> =>
  request<LogoutUserResponse, DeleteUserRequest>({
    url: '/users/logout',
    method: 'post',
    data
  })
