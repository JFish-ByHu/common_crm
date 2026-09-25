import { createMicroAppRouter, installPermissionRoutes } from '@common-crm/router'
import { CrmAccessResult } from '@common-crm/components'
import { pageComponents } from 'virtual:crm-pages/components'
import { customerManifest, getMicroAppProps } from '../micro-app'
import { authorization, ensureAuthorization } from '../services'

export const createCustomerRouter = () => {
  const result = createMicroAppRouter({
    basePath: customerManifest.basePath,
    navigation: getMicroAppProps().navigation,
    routes: [
      {
        path: '/access-denied',
        name: 'access-denied',
        component: CrmAccessResult,
        props: route => ({ unavailable: route.query.unavailable === '1' })
      },
      { path: '/:pathMatch(.*)*', component: CrmAccessResult }
    ]
  })
  installPermissionRoutes({
    router: result.router,
    basePath: customerManifest.basePath,
    refresh: ensureAuthorization,
    pages: () => authorization.pages.value,
    components: pageComponents,
    missingComponent: CrmAccessResult
  })
  return result
}
