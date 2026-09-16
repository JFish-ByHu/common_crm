/**
 * API 客户端配置
 */
export interface ApiClientConfig {
  baseURL: string
  timeout?: number
  withCredentials?: boolean
  onUnauthorized?: () => void
  getAccessToken?: () => string | null
  onTokenExpired?: () => void
}

/**
 * API 统一响应结构
 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/**
 * 分页请求参数
 */
export interface PageRequest {
  page: number
  pageSize: number
}

/**
 * 分页响应数据
 */
export interface PageResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
