import { initRequest } from '@common-crm/api'
import type { Pinia } from 'pinia'
import type { Router } from 'vue-router'
import { useAuthStore } from '../stores'

/**
 * 初始化 API 客户端
 */
export function initApiClient(pinia: Pinia, router: Router) {
  const authStore = useAuthStore(pinia)
  initRequest({
    baseURL: import.meta.env?.VITE_API_BASE_URL ?? '/api',
    timeout: 10000,
    withCredentials: true,
    getAccessToken: () => authStore.accessToken,
    onUnauthorized: async () => {
      const currentRoute = router.currentRoute.value
      authStore.clearTokens()
      if (currentRoute.path !== '/login') {
        await router.replace({
          path: '/login',
          query: { redirect: currentRoute.fullPath }
        })
      }
    }
  })
}

// 导出所有 API 方法，方便使用
export * from '@common-crm/api'
