import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Odometer } from '@element-plus/icons-vue'
import { matchesMicroAppPath } from '@common-crm/router'
import { microAppModules } from '../../micro-apps'
import type { BreadcrumbItem, LayoutMenuItem } from '../components'

const menuItems: LayoutMenuItem[] = [
  { path: '/dashboard', title: '控制台', icon: Odometer, menuOrder: 10 },
  ...microAppModules.map(({ manifest, icon, menuOrder }) => ({
    path: manifest.basePath,
    title: manifest.title,
    icon,
    menuOrder,
    children: manifest.menu?.map(page => ({
      path: page.path === '/' ? manifest.basePath : `${manifest.basePath}${page.path}`,
      title: page.title
    }))
  }))
].sort((left, right) => left.menuOrder - right.menuOrder)

export function useLayoutNavigation() {
  const route = useRoute()
  const activeTrail = computed(() => {
    const parent = menuItems.find(item => matchesMicroAppPath(route.path, item.path))
    if (!parent) return []

    const child = parent.children
      ?.filter(item => matchesMicroAppPath(route.path, item.path))
      .sort((left, right) => right.path.length - left.path.length)[0]

    return child ? [parent, child] : [parent]
  })

  const activeMenu = computed(() => activeTrail.value.at(-1)?.path ?? route.path)
  const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    if (!activeTrail.value.length) {
      return [{ title: (route.meta.title as string) || '控制台' }]
    }

    return activeTrail.value.map((item, index, trail) => ({
      title: item.title,
      to: index < trail.length - 1 ? item.path : undefined
    }))
  })

  return { menuItems, activeMenu, breadcrumbItems }
}
