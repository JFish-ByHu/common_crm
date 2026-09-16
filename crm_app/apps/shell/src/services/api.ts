import { initRequest } from '@common-crm/api'
import { router } from '../router'

/**
 * 初始化 API 客户端
 */
export function initApiClient() {
  initRequest({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
    timeout: 10000,
    withCredentials: true,
    getAccessToken: () => {
      // 从 localStorage 获取 token
      return localStorage.getItem('accessToken')
    },
    onUnauthorized: () => {
      // 清除 token 并跳转到登录页
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      router.push('/login')
    },
    onTokenExpired: () => {
      // Token 过期，清除并跳转登录
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      router.push('/login')
    },
  })
}

// 导出所有 API 方法，方便使用
export * from '@common-crm/api'
