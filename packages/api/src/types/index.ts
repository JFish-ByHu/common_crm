import type { AxiosRequestConfig } from 'axios'

/**
 * API 客户端配置
 */
export interface ApiClientConfig {
  baseURL: string
  timeout?: number
  withCredentials?: boolean
  /** 是否显示请求进度条，默认 true。 */
  showProgress?: boolean
  onUnauthorized?: () => void | Promise<void>
  getAccessToken?: () => string | null
}

export interface ApiRequestConfig<D = unknown> extends AxiosRequestConfig<D> {
  /** 登录等公开请求设为 false，跳过自动 token 注入和全局 401 处理。 */
  requiresAuth?: boolean
  /** 覆盖客户端进度条配置，轮询等后台请求可设为 false。 */
  showProgress?: boolean
  /** 开发后端重启时有限重试；默认仅 GET/HEAD，幂等心跳可显式开启。 */
  retryOnUnavailable?: boolean
}

export type ApiErrorKind = 'business' | 'http' | 'network' | 'timeout' | 'protocol' | 'unknown'

export type { ApiResponse, PageRequest, PageResponse } from '@common-crm/types/api'
