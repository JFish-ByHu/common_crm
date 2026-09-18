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
export interface LoginResponse {
  accessToken: string
  refreshToken: string
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
