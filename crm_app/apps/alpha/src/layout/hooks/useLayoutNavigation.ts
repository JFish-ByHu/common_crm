import { computed } from 'vue'
import { useRoute } from 'vue-router'
import * as Icons from '@element-plus/icons-vue'
import type { AuthorizedMenu } from '@common-crm/types/api'
import { useAuthorizationStore } from '../../stores'
import type { BreadcrumbItem, LayoutMenuItem } from '../components'

export const useLayoutNavigation = () => {
  const route = useRoute()
  const authorization = useAuthorizationStore()
  const convert = (menus: AuthorizedMenu[], root = true): LayoutMenuItem[] =>
    menus
      .filter(menu => menu.enabled && menu.visible && !menu.routePath?.includes(':'))
      .map(menu => {
        const children = convert(menu.children, false)
        const isDirectory = menu.menuType === 'DIRECTORY'
        return {
          path: isDirectory
            ? `directory:${menu.menuId}`
            : menu.componentKey && menu.routePath
              ? menu.routePath
              : `unconfigured:${menu.menuId}`,
          title: menu.name,
          icon: root && menu.icon ? Icons[menu.icon as keyof typeof Icons] : undefined,
          children: isDirectory ? children : undefined
        }
      })
  const menuItems = computed<LayoutMenuItem[]>(() => [
    { path: '/dashboard', title: '控制台', icon: Icons.Odometer },
    ...convert(authorization.state?.menus ?? [])
  ])
  const findTrail = (items: LayoutMenuItem[], path: string): LayoutMenuItem[] => {
    for (const item of items) {
      if (item.path === path) return [item]
      const children = findTrail(item.children ?? [], path)
      if (children.length) return [item, ...children]
    }
    return []
  }
  const activeTrail = computed(() => findTrail(menuItems.value, route.path))
  const activeMenu = computed(() => route.path)
  const breadcrumbItems = computed<BreadcrumbItem[]>(() =>
    activeTrail.value.length
      ? activeTrail.value.map(item => ({ title: item.title }))
      : [
          {
            title:
              authorization.findPage(route.path)?.name ?? (route.meta.title as string) ?? '控制台'
          }
        ]
  )
  return { menuItems, activeMenu, breadcrumbItems }
}
