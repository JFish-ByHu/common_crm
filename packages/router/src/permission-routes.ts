import type { RouteComponent, Router } from 'vue-router'
import type { AuthorizedMenu } from '@common-crm/types/api'
import { isPageRoutePath } from './page-path'

interface PermissionRouteOptions {
  router: Router
  basePath: string
  components: Record<string, RouteComponent | (() => Promise<unknown>)>
  missingComponent: RouteComponent
  refresh: () => Promise<void>
  pages: () => AuthorizedMenu[]
}

/** Only restore an internal route, never the access-result page itself. */
export const resolvePermissionRetryPath = (value: unknown, fallback: string): string =>
  typeof value === 'string' &&
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !value.includes('\\') &&
  value.split(/[?#]/, 1)[0] !== '/access-denied'
    ? value
    : fallback

/** Route implementations stay inside their micro-app; only registered components can be mounted. */
export const installPermissionRoutes = ({
  router,
  basePath,
  components,
  missingComponent,
  refresh,
  pages
}: PermissionRouteOptions) => {
  const installed = new Map<string, { signature: string; remove: () => void }>()
  router.beforeEach(async to => {
    const isAccessResult = to.name === 'access-denied'
    // A failure redirect must render once; a reload/direct visit must retry authorization.
    if (isAccessResult && to.redirectedFrom) return
    try {
      await refresh()
    } catch {
      if (isAccessResult) return
      return {
        name: 'access-denied',
        query: { unavailable: '1', redirect: to.fullPath }
      }
    }
    if (isAccessResult) return resolvePermissionRetryPath(to.query.redirect, '/')
    const available = pages().filter(
      page =>
        page.componentKey &&
        page.routePath &&
        isPageRoutePath(page.routePath) &&
        (page.routePath === basePath || page.routePath.startsWith(basePath + '/'))
    )
    const ids = new Set(available.map(page => page.menuId))
    for (const [id, route] of installed)
      if (!ids.has(id)) {
        route.remove()
        installed.delete(id)
      }
    for (const page of available) {
      const signature = JSON.stringify([page.routePath, page.componentKey, page.name])
      const previous = installed.get(page.menuId)
      if (previous?.signature === signature) continue
      previous?.remove()
      const remove = router.addRoute({
        path: page.routePath!.slice(basePath.length) || '/',
        name: `authorized-${page.menuId}`,
        component: (components[page.componentKey!] ?? missingComponent) as RouteComponent,
        props: components[page.componentKey!] ? false : { missingComponent: true },
        strict: true,
        sensitive: true,
        meta: { title: page.name, requiresAuth: true }
      })
      installed.set(page.menuId, { signature, remove })
    }
    const resolved = router.resolve(to.fullPath)
    if (available.some(page => resolved.name === `authorized-${page.menuId}`)) {
      if (
        to.name !== resolved.name ||
        to.matched.some((record, index) => record !== resolved.matched[index])
      )
        return { path: to.fullPath, replace: true }
      return
    }
    const firstPage = available.find(page => page.visible && !page.routePath!.includes(':'))
    if (to.path === '/' && firstPage) return firstPage.routePath!.slice(basePath.length) || '/'
    return { name: 'access-denied', query: { redirect: to.fullPath } }
  })
}
