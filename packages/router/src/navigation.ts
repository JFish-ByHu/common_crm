import type { MicroAppNavigation } from '@common-crm/types'
import type { Router } from 'vue-router'

export function matchesMicroAppPath(path: string, basePath: string): boolean {
  return path === basePath || path.startsWith(`${basePath}/`)
}

export function createMicroAppNavigation(router: Router, basePath: string): MicroAppNavigation {
  const localPath = (fullPath: string) => {
    const path = fullPath.slice(basePath.length)
    return path.startsWith('/') ? path : `/${path}`
  }

  const isActive = () => matchesMicroAppPath(router.currentRoute.value.path, basePath)
  const navigate = async (path: string, replace: boolean) => {
    if (!isActive()) return

    const fullPath = `${basePath}${path === '/' ? '' : path}`
    if (fullPath === router.currentRoute.value.fullPath) return

    await router[replace ? 'replace' : 'push'](fullPath)
  }

  return {
    getPath: () => localPath(router.currentRoute.value.fullPath),
    push: path => navigate(path, false),
    replace: path => navigate(path, true),
    go: delta => {
      if (isActive()) router.go(delta)
    },
    subscribe: listener =>
      router.afterEach((to, _from, failure) => {
        if (!failure && matchesMicroAppPath(to.path, basePath)) {
          listener(localPath(to.fullPath))
        }
      })
  }
}
