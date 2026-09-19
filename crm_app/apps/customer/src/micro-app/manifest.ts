import type { MicroAppManifest, MicroAppPage } from '@common-crm/types'

export const customerPages = {
  list: { path: '/', title: '客户管理' }
} satisfies Record<string, MicroAppPage>

export const customerManifest: MicroAppManifest = {
  name: 'customer',
  basePath: '/customer',
  title: customerPages.list.title
}
