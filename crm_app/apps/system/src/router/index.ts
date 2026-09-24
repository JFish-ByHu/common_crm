import { createMicroAppRouter } from '@common-crm/router'
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
import { getMicroAppProps, systemManifest, systemPages } from '../micro-app'

export const createSystemRouter = () => {
  const result = createMicroAppRouter({
    basePath: systemManifest.basePath,
    navigation: getMicroAppProps().navigation,
    routes: [
      {
        path: '/',
        redirect: systemPages.users.path
      },
      {
        path: systemPages.users.path,
        name: 'system-users',
        component: () => import('../views/users/index.vue'),
        meta: { requiresAuth: true, title: systemPages.users.title }
      },
      {
        path: systemPages.roles.path,
        name: 'system-roles',
        component: () => import('../views/roles/index.vue'),
        meta: { requiresAuth: true, title: systemPages.roles.title }
      },
      {
        path: '/:pathMatch(.*)*',
        redirect: systemPages.users.path
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
