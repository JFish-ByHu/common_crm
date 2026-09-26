import { notifySessionExpired } from '@common-crm/utils'
import { initRequest } from '@common-crm/api'
import { getMicroAppProps } from '../micro-app'

/**
 * 初始化客户管理子应用使用的 API 客户端。
 */
export const initApiClient = () => {
  initRequest({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
    timeout: 10000,
    withCredentials: true,
    getAccessToken: () =>
      getMicroAppProps().getAuthState?.().accessToken ?? localStorage.getItem('crm-access-token'),
    onUnauthorized: () => {
      notifySessionExpired()
      localStorage.removeItem('crm-access-token')
      localStorage.removeItem('crm-refresh-token')
      if (window.location.pathname !== '/login') {
        const redirect = window.location.pathname + window.location.search + window.location.hash
        window.location.replace('/login?redirect=' + encodeURIComponent(redirect))
      }
    }
  })
}

export * from '@common-crm/api'
