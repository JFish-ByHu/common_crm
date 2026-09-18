export interface SharedAuthState {
  isAuthenticated: boolean
  accessToken: string | null
}

export interface SharedThemeState {
  mode: 'light' | 'dark'
  isDark: boolean
}

export interface SystemMicroAppProps {
  container?: Element
  getAuthState?: () => SharedAuthState
  getThemeState?: () => SharedThemeState
}

declare global {
  interface Window {
    __SYSTEM_QIANKUN_PROPS__?: SystemMicroAppProps
  }
}
