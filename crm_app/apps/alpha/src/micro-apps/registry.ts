import type { MicroAppProps } from '@common-crm/types'
import type { RegistrableApp } from 'qiankun'
import { useAuthStore, useThemeStore } from '../stores'
import { createMicroAppEventBus } from './event-bus'

/** 获取 alpha 基座注册的业务子应用。 */
export function getMicroApps(): RegistrableApp<MicroAppProps>[] {
  const eventBus = createMicroAppEventBus()
  const sharedProps: MicroAppProps = {
    appName: 'Common CRM',
    getAuthState: () => {
      const authStore = useAuthStore()
      return {
        isAuthenticated: authStore.isAuthenticated,
        accessToken: authStore.accessToken
      }
    },
    getThemeState: () => {
      const themeStore = useThemeStore()
      return {
        mode: themeStore.mode,
        isDark: themeStore.isDark
      }
    },
    eventBus
  }

  return [
    {
      name: 'customer',
      entry: import.meta.env.VITE_CUSTOMER_ENTRY ?? 'http://localhost:8801',
      container: '#micro-app-container',
      activeRule: '/customer',
      props: sharedProps
    },
    {
      name: 'system',
      entry: import.meta.env.VITE_SYSTEM_ENTRY ?? 'http://localhost:8802',
      container: '#micro-app-container',
      activeRule: '/system',
      props: sharedProps
    }
  ]
}
