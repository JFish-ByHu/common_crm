import { customerManifest } from '@common-crm/customer/manifest'
import { systemManifest } from '@common-crm/system/manifest'
import { Setting, User } from '@element-plus/icons-vue'

export const microAppModules = [
  {
    manifest: customerManifest,
    entry: import.meta.env.VITE_CUSTOMER_ENTRY ?? 'http://localhost:8801',
    icon: User,
    menuOrder: 20
  },
  {
    manifest: systemManifest,
    entry: import.meta.env.VITE_SYSTEM_ENTRY ?? 'http://localhost:8802',
    icon: Setting,
    menuOrder: 50
  }
]
