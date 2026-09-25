import { createRouterMatcher, START_LOCATION } from 'vue-router'
import type { AuthorizedMenu } from '@common-crm/types/api'

/** 与后端配置校验一致：仅支持静态段和必填的命名参数，不开放任意正则或通配符。 */
export const isPageRoutePath = (path: string): boolean => {
  if (path.length > 255 || !/^(?:\/(?:[a-zA-Z0-9_-]+|:[a-zA-Z][a-zA-Z0-9_]*))+$/.test(path))
    return false
  const parameters = path.split('/').filter(part => part.startsWith(':'))
  return parameters.length === new Set(parameters).size
}

/** 使用 Vue Router 自身的优先级和参数匹配规则，与实际页面解析保持一致。 */
export const createAuthorizedPageMatcher = (pages: AuthorizedMenu[]) => {
  const valid = pages.filter(page => page.routePath && isPageRoutePath(page.routePath))
  const byId = new Map(valid.map(page => [page.menuId, page]))
  const matcher = createRouterMatcher(
    valid.map(page => ({
      path: page.routePath!,
      name: page.menuId,
      component: {}
    })),
    { strict: true, sensitive: true }
  )
  return (path: string) => {
    const matched = matcher.resolve({ path }, START_LOCATION)
    return typeof matched.name === 'string' ? byId.get(matched.name) : undefined
  }
}
