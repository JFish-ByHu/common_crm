import type { MicroAppManifest, MicroAppPage } from '@common-crm/types'

export const systemPages = {
  users: { path: '/users', title: '用户管理' },
  roles: { path: '/roles', title: '角色管理' },
  menus: { path: '/menus', title: '菜单管理' }
} satisfies Record<string, MicroAppPage>

export const systemManifest: MicroAppManifest = {
  name: 'system',
  basePath: '/system',
  title: '系统管理',
  menu: [systemPages.users, systemPages.roles, systemPages.menus]
}
