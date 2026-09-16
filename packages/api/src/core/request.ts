import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig, type AxiosRequestConfig } from 'axios'
import type { ApiClientConfig } from '../types'

let axiosInstance: AxiosInstance | null = null

/**
 * 初始化 axios 实例
 */
export function initRequest(config: ApiClientConfig) {
  axiosInstance = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout || 10000,
    withCredentials: config.withCredentials ?? true,
  })

  // 请求拦截器：自动添加 token
  axiosInstance.interceptors.request.use(
    (requestConfig: InternalAxiosRequestConfig) => {
      const token = config.getAccessToken?.()
      if (token && requestConfig.headers) {
        requestConfig.headers.Authorization = `Bearer ${token}`
      }
      return requestConfig
    },
    (error: AxiosError) => {
      return Promise.reject(error)
    }
  )

  // 响应拦截器：统一处理响应和错误
  axiosInstance.interceptors.response.use(
    (response) => {
      // 直接返回响应数据
      return response.data
    },
    (error: AxiosError) => {
      // 网络错误或请求超时
      if (!error.response) {
        const apiError = new ApiError(
          error.message || '网络连接失败',
          -1,
          undefined,
          error
        )
        return Promise.reject(apiError)
      }

      const { status, data } = error.response
      const responseData = data as any

      // 401 未授权
      if (status === 401) {
        config.onUnauthorized?.()
        const apiError = new ApiError(
          responseData?.message || '未授权，请重新登录',
          responseData?.code || 401,
          status,
          responseData
        )
        return Promise.reject(apiError)
      }

      // 403 Token 过期
      if (status === 403 && responseData?.code === 'TOKEN_EXPIRED') {
        config.onTokenExpired?.()
      }

      // 其他业务错误
      const apiError = new ApiError(
        responseData?.message || '请求失败',
        responseData?.code || status,
        status,
        responseData
      )
      return Promise.reject(apiError)
    }
  )

  return axiosInstance
}

/**
 * 获取 axios 实例
 */
export function getAxiosInstance(): AxiosInstance {
  if (!axiosInstance) {
    throw new Error('Request not initialized. Call initRequest() first.')
  }
  return axiosInstance
}

/**
 * 统一请求方法
 */
export function request<T = any>(config: AxiosRequestConfig): Promise<T> {
  const instance = getAxiosInstance()
  return instance.request(config) as Promise<T>
}

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code: number,
    public status?: number,
    public response?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
