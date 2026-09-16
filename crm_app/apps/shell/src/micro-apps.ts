import type { RegistrableApp } from 'qiankun'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'

export function getMicroApps(): RegistrableApp<Record<string, unknown>>[] {
  return [
    {
      name: 'customer',
      entry: import.meta.env.VITE_CUSTOMER_ENTRY ?? 'http://localhost:8801',
      container: '#micro-app-container',
      activeRule: '/customer',
      props: {
        // 传递共享数据
        appName: 'Common CRM',
        // 获取认证状态
        getAuthState: () => {
          const authStore = useAuthStore()
          return {
            isAuthenticated: authStore.isAuthenticated,
            accessToken: authStore.accessToken,
          }
        },
        // 获取主题状态
        getThemeState: () => {
          const themeStore = useThemeStore()
          return {
            mode: themeStore.mode,
            isDark: themeStore.isDark,
          }
        },
        // 全局事件总线（用于子应用间通信）
        eventBus: {
          emit: (event: string, data: any) => {
            window.dispatchEvent(new CustomEvent(`qiankun:${event}`, { detail: data }))
          },
          on: (event: string, handler: (data: any) => void) => {
            window.addEventListener(`qiankun:${event}`, (e: Event) => {
              handler((e as CustomEvent).detail)
            })
          },
          off: (event: string, handler: (data: any) => void) => {
            window.removeEventListener(`qiankun:${event}`, handler)
          }
        }
      }
    }
  ]
}
