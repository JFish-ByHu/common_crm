import {
  createMemoryHistory,
  createRouter,
  createWebHistory,
  isNavigationFailure,
  NavigationFailureType,
  type RouteRecordRaw
} from 'vue-router'
import type { MicroAppNavigation } from '@common-crm/types'

interface MicroAppRouterOptions {
  basePath: string
  routes: RouteRecordRaw[]
  navigation?: MicroAppNavigation
}

export function createMicroAppRouter({ basePath, routes, navigation }: MicroAppRouterOptions) {
  const history = navigation ? createMemoryHistory(basePath) : createWebHistory()
  const router = createRouter({ history, routes })
  let disposed = false
  let unsubscribe: (() => void) | undefined

  if (navigation) {
    history.replace(navigation.getPath())

    // 保留 Vue Router 的 push/replace 语义，仅由 Alpha 写入浏览器历史。
    const push = history.push.bind(history)
    const replace = history.replace.bind(history)
    history.push = (to, data) => {
      push(to, data)
      if (!disposed) void navigation.push(to)
    }
    history.replace = (to, data) => {
      replace(to, data)
      if (!disposed) void navigation.replace(to)
    }
    history.go = delta => {
      if (!disposed) navigation.go(delta)
    }

    unsubscribe = navigation.subscribe(path => {
      if (router.currentRoute.value.fullPath === path) return

      void router.replace(path).then(failure => {
        // 已在默认页时，重定向会被判为重复导航，仍需规范化 Alpha 的地址。
        if (
          !disposed &&
          navigation.getPath() === path &&
          isNavigationFailure(failure, NavigationFailureType.duplicated)
        ) {
          return navigation.replace(router.currentRoute.value.fullPath)
        }
      })
    })
  }

  return {
    router,
    dispose() {
      disposed = true
      unsubscribe?.()
      router.listening = false
      history.destroy()
    }
  }
}
