import { createRouter, createWebHistory } from 'vue-router'
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
import App from '../App.vue'

export function createCustomerRouter() {
  const router = createRouter({
    history: createWebHistory(qiankunWindow.__POWERED_BY_QIANKUN__ ? '/customer' : '/'),
    routes: [
      {
        path: '/:pathMatch(.*)*',
        name: 'customer-root',
        component: App,
        meta: { requiresAuth: true }
      }
    ]
  })

  // 子应用路由守卫
  router.beforeEach(to => {
    // 在 qiankun 环境下，认证由主应用负责
    if (qiankunWindow.__POWERED_BY_QIANKUN__) {
      const props = (window as any).__QIANKUN_PROPS__
      const authState = props?.getAuthState?.()

      if (!authState?.isAuthenticated && to.meta.requiresAuth !== false) {
        // 未认证，通知主应用跳转到登录页
        window.location.href = '/login?redirect=' + encodeURIComponent(to.fullPath)
        return false
      }
    }
  })

  return router
}
