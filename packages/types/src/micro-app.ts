import type { CurrentAuthorization } from './api/index.js'

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
  /** Share Alpha's session-scoped snapshot; force refresh after permission mutations. */
  getAuthorization?: (force?: boolean) => Promise<CurrentAuthorization>
  getThemeState?: () => SharedThemeState
  eventBus?: MicroAppEventBus
  navigation?: MicroAppNavigation
}

/** Alpha 持有浏览器历史，路径参数均相对子应用根目录。 */
export interface MicroAppNavigation {
  getPath(): string
  push(path: string): Promise<void>
  replace(path: string): Promise<void>
  go(delta: number): void
  subscribe(listener: (path: string) => void): () => void
}

/** 路径相对子应用的 history base，例如 /users。 */
export interface MicroAppPage {
  path: `/${string}`
  title: string
}

/** 子应用公开的纯数据清单，不包含页面组件和路由实例。 */
export interface MicroAppManifest {
  name: string
  basePath: `/${string}`
  title: string
  /** 省略时，模块本身就是菜单入口；配置后展示为二级菜单。 */
  menu?: readonly MicroAppPage[]
}
