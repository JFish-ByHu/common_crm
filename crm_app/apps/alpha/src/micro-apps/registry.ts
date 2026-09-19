import type { MicroAppProps } from '@common-crm/types'
import type { RegistrableApp } from 'qiankun'
import type { Router } from 'vue-router'
import { createMicroAppNavigation, matchesMicroAppPath } from '@common-crm/router'
import { useAuthStore, useThemeStore } from '../stores'
import { createMicroAppEventBus } from './event-bus'
import { microAppModules } from './modules'

/** 获取 alpha 基座注册的业务子应用。 */
export function getMicroApps(router: Router): RegistrableApp<MicroAppProps>[] {
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

  return microAppModules.map(({ manifest, entry }) => ({
    name: manifest.name,
    entry,
    container: '#micro-app-container',
    activeRule: location => matchesMicroAppPath(location.pathname, manifest.basePath),
    props: { ...sharedProps, navigation: createMicroAppNavigation(router, manifest.basePath) }
  }))
}
