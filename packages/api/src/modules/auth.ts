import type { ApiResponse } from '../types'
import { request } from '../core'

/**
 * 登录请求参数
 */
export interface LoginRequest {
  username: string
  password: string
}

/**
 * 登录响应数据
 */
export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export type LoginResponse = AuthTokens

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface CurrentUser {
  userId: string
  username: string
  email: string | null
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

/**
 * 用户登录
 */
export function login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  return request<LoginResponse, LoginRequest>({
    url: '/auth/login',
    method: 'post',
    data,
    requiresAuth: false
  })
}

/**
 * 使用 refresh token 轮换访问令牌和刷新令牌
 */
export function refreshTokens(data: RefreshTokenRequest): Promise<ApiResponse<AuthTokens>> {
  return request<AuthTokens, RefreshTokenRequest>({
    url: '/auth/refresh',
    method: 'post',
    data,
    requiresAuth: false
  })
}

/**
 * 获取当前登录用户
 */
export function getCurrentUser(): Promise<ApiResponse<CurrentUser>> {
  return request<CurrentUser>({ url: '/auth/me', method: 'get' })
}

/**
 * 撤销当前 refresh session
 */
export function logout(data: RefreshTokenRequest): Promise<ApiResponse<null>> {
  return request<null, RefreshTokenRequest>({
    url: '/auth/logout',
    method: 'post',
    data,
    requiresAuth: false
  })
}

/**
 * 修改当前用户密码，成功后服务端会撤销该用户的所有会话
 */
export function changePassword(data: ChangePasswordRequest): Promise<ApiResponse<null>> {
  return request<null, ChangePasswordRequest>({
    url: '/auth/password',
    method: 'patch',
    data
  })
}
