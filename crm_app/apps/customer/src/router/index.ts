import { createMicroAppRouter } from '@common-crm/router'
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
import { customerManifest, customerPages, getMicroAppProps } from '../micro-app'

export function createCustomerRouter() {
  const result = createMicroAppRouter({
    basePath: customerManifest.basePath,
    navigation: getMicroAppProps().navigation,
    routes: [
      {
        path: customerPages.list.path,
        name: 'customer-list',
        component: () => import('../views/customers/index.vue'),
        meta: { requiresAuth: true, title: customerPages.list.title }
      },
      {
        path: '/:pathMatch(.*)*',
        redirect: customerPages.list.path
      }
    ]
  })

  result.router.beforeEach(to => {
    if (!qiankunWindow.__POWERED_BY_QIANKUN__) return

    const authState = getMicroAppProps().getAuthState?.()
    if (!authState?.isAuthenticated && to.meta.requiresAuth !== false) {
      const redirect = window.location.pathname + window.location.search + window.location.hash
      window.location.replace('/login?redirect=' + encodeURIComponent(redirect))
      return false
    }
  })

  return result
}
