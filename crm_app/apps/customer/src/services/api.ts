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
      return localStorage.getItem('crm-access-token')
    },
    onUnauthorized: () => {
      localStorage.removeItem('crm-access-token')
      localStorage.removeItem('crm-refresh-token')
      if (window.location.pathname !== '/login') {
        const redirect = window.location.pathname + window.location.search + window.location.hash
        window.location.replace('/login?redirect=' + encodeURIComponent(redirect))
      }
    }
  })
}

// 导出所有 API 方法，方便使用
export * from '@common-crm/api'
