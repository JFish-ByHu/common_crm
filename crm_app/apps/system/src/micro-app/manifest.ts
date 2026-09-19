import type { MicroAppManifest, MicroAppPage } from '@common-crm/types'

export const systemPages = {
  users: { path: '/users', title: '用户管理' }
} satisfies Record<string, MicroAppPage>

export const systemManifest: MicroAppManifest = {
  name: 'system',
  basePath: '/system',
  title: '系统管理',
  menu: [systemPages.users]
}
