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

export interface HeartbeatResponse {
  recorded: boolean
}
export type LogoutRequest = RefreshTokenRequest
