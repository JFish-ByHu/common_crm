export type ThemeMode = 'light' | 'dark'

export interface SharedAuthState {
  isAuthenticated: boolean
  accessToken: string | null
}

export interface SharedThemeState {
  mode: ThemeMode
  isDark: boolean
}

export type MicroAppEventHandler = (data: unknown) => void

export interface MicroAppEventBus {
  emit(event: string, data: unknown): void
  on(event: string, handler: MicroAppEventHandler): void
  off(event: string, handler: MicroAppEventHandler): void
}

/** alpha 基座与业务子应用之间的稳定通信契约。 */
export interface MicroAppProps {
  appName?: string
  container?: Element
  getAuthState?: () => SharedAuthState
  getThemeState?: () => SharedThemeState
  eventBus?: MicroAppEventBus
}
