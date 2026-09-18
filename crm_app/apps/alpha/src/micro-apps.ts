import type { RegistrableApp } from 'qiankun'
import { useAuthStore, useThemeStore } from './stores'

export function getMicroApps(): RegistrableApp<Record<string, unknown>>[] {
  const sharedProps = {
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
    eventBus: {
      emit: (event: string, data: unknown) => {
        window.dispatchEvent(new CustomEvent(`qiankun:${event}`, { detail: data }))
      },
      on: (event: string, handler: (data: unknown) => void) => {
        window.addEventListener(`qiankun:${event}`, (e: Event) => {
          handler((e as CustomEvent).detail)
        })
      },
      off: (event: string, handler: EventListener) => {
        window.removeEventListener(`qiankun:${event}`, handler)
      }
    }
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
