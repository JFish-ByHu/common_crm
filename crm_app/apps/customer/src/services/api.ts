import { initRequest } from '@common-crm/api'

/**
 * 初始化 API 客户端（用于独立运行模式）
 */
export function initApiClient() {
  initRequest({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
    timeout: 10000,
    withCredentials: true,
    getAccessToken: () => {
      return localStorage.getItem('accessToken')
    },
    onUnauthorized: () => {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
    },
  })
}

// 导出所有 API 方法，方便使用
export * from '@common-crm/api'
