import type { RouteComponent, Router } from 'vue-router'
import type { AuthorizedMenu } from '@common-crm/types/api'

interface PermissionRouteOptions {
  router: Router
  basePath: string
  components: Record<string, RouteComponent | (() => Promise<unknown>)>
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
        components[page.componentKey] &&
        page.routePath &&
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
        component: components[page.componentKey!] as RouteComponent,
        meta: { title: page.name, requiresAuth: true }
      })
      installed.set(page.menuId, { signature, remove })
    }
    const page = available.find(item => (item.routePath!.slice(basePath.length) || '/') === to.path)
    if (page) {
      if (to.name !== `authorized-${page.menuId}`) return { path: to.fullPath, replace: true }
      return
    }
    if (to.path === '/' && available[0])
      return available[0].routePath!.slice(basePath.length) || '/'
    return { name: 'access-denied', query: { redirect: to.fullPath } }
  })
}
