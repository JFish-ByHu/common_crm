import { createRouter, createWebHistory } from 'vue-router'
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
import { getMicroAppProps } from '../micro-app'

export function createSystemRouter() {
  const router = createRouter({
    history: createWebHistory(qiankunWindow.__POWERED_BY_QIANKUN__ ? '/system' : '/'),
    routes: [
      {
        path: '/',
        redirect: '/users'
      },
      {
        path: '/users',
        name: 'system-users',
        component: () => import('../views/users/index.vue'),
        meta: { requiresAuth: true, title: '用户管理' }
      },
      {
        path: '/:pathMatch(.*)*',
        redirect: '/users'
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
