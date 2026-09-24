import { request } from '../core'
import type { ApiRequestConfig, ApiResponse, PageRequest } from '../types'

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
  email: string | null
  onlineStatus: UserOnlineStatus
  /** 中国标准时间，格式为 yyyy-MM-dd HH:mm:ss。 */
  createTime: string
  /** 中国标准时间，格式为 yyyy-MM-dd HH:mm:ss。 */
  updateTime: string
}

export interface QueryUserListRequest extends Partial<PageRequest> {
  /** 匹配用户 ID、用户名或邮箱。 */
  keyword?: string
  accountStatus?: UserAccountStatus
}

export interface QueryUserSelectListRequest extends Partial<PageRequest> {
  username?: string
}

export interface UserListResponse<T = UserListItem> {
  list: T[]
  total: number
  /** 未传分页参数时查询全部，分页信息为 null。 */
  page: number | null
  pageSize: number | null
}

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

export interface DeleteUsersResponse {
  deletedCount: number
}

export interface LogoutUserResponse {
  revokedCount: number
}

type UserQueryConfig = Pick<ApiRequestConfig, 'signal' | 'showProgress'>

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
