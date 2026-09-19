import { createRouter, createWebHistory } from 'vue-router'
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
import { getMicroAppProps } from '../micro-app'

export function createCustomerRouter() {
  const router = createRouter({
    history: createWebHistory(qiankunWindow.__POWERED_BY_QIANKUN__ ? '/customer' : '/'),
    routes: [
      {
        path: '/',
        name: 'customer-list',
        component: () => import('../views/customers/index.vue'),
        meta: { requiresAuth: true, title: '客户管理' }
      },
      {
        path: '/:pathMatch(.*)*',
        redirect: '/'
      }
    ]
  })

  router.beforeEach(to => {
    if (!qiankunWindow.__POWERED_BY_QIANKUN__) return

    const authState = getMicroAppProps().getAuthState?.()
    if (!authState?.isAuthenticated && to.meta.requiresAuth !== false) {
      const redirect = window.location.pathname + window.location.search + window.location.hash
      window.location.replace('/login?redirect=' + encodeURIComponent(redirect))
      return false
    }
  })

  return router
}
