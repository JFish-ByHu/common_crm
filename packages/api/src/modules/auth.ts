import type {
  HeartbeatResponse,
  LogoutRequest,
  LoginRequest,
  AuthTokens,
  LoginResponse,
  RefreshTokenRequest,
  CurrentUser,
  ChangePasswordRequest
} from '@common-crm/types/api'
import { request } from '../core'
import type { ApiQueryConfig, ApiRequestConfig, ApiResponse } from '../types'

export type {
  LoginRequest,
  AuthTokens,
  LoginResponse,
  RefreshTokenRequest,
  CurrentUser,
  ChangePasswordRequest,
  HeartbeatResponse,
  LogoutRequest
} from '@common-crm/types/api'

/** 更新当前认证会话的在线记录，不延长 token 有效期。 */
export const sendHeartbeat = (
  config: Pick<ApiRequestConfig, 'signal'> = {}
): Promise<ApiResponse<HeartbeatResponse>> =>
  request<HeartbeatResponse>({
    ...config,
    url: '/auth/heartbeat',
    method: 'post',
    timeout: 5000,
    retryOnUnavailable: true,
    showProgress: false
  })

/** 用户登录。 */
export const login = (data: LoginRequest): Promise<ApiResponse<LoginResponse>> =>
  request<LoginResponse, LoginRequest>({
    url: '/auth/login',
    method: 'post',
    data,
    requiresAuth: false
  })

/** 使用 refresh token 轮换访问令牌和刷新令牌。 */
export const refreshTokens = (data: RefreshTokenRequest): Promise<ApiResponse<AuthTokens>> =>
  request<AuthTokens, RefreshTokenRequest>({
    url: '/auth/refresh',
    method: 'post',
    data,
    requiresAuth: false
  })

/** 获取当前登录用户。 */
export const getCurrentUser = (config: ApiQueryConfig = {}): Promise<ApiResponse<CurrentUser>> =>
  request<CurrentUser>({
    ...config,
    url: '/auth/me',
    method: 'get'
  })

/** 撤销当前 refresh session。 */
export const logout = (data: LogoutRequest): Promise<ApiResponse<null>> =>
  request<null, LogoutRequest>({
    url: '/auth/logout',
    method: 'post',
    data,
    requiresAuth: false
  })

/** 修改当前用户密码，成功后服务端会撤销该用户的所有会话。 */
export const changePassword = (data: ChangePasswordRequest): Promise<ApiResponse<null>> =>
  request<null, ChangePasswordRequest>({
    url: '/auth/password',
    method: 'patch',
    data
  })
