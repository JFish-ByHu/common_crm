import { createMicroAppRouter, installPermissionRoutes } from '@common-crm/router'
import { CrmAccessResult } from '@common-crm/components'
import { pageComponents } from 'virtual:crm-pages/components'
import { getMicroAppProps, systemManifest } from '../micro-app'
import { authorization, ensureAuthorization } from '../services'

export const createSystemRouter = () => {
  const result = createMicroAppRouter({
    basePath: systemManifest.basePath,
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
    basePath: systemManifest.basePath,
    refresh: ensureAuthorization,
    pages: () => authorization.pages.value,
    components: pageComponents,
    missingComponent: CrmAccessResult
  })
  return result
}
