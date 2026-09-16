import { inject } from 'vue'

/**
 * 获取主应用传递的 props
 */
export function useQiankunProps() {
  // 在组件中使用 inject
  const props = inject('qiankunProps', null)

  // 如果 inject 没有值，尝试从 window 获取（用于非组件场景）
  return props || (window as any).__QIANKUN_PROPS__ || {}
}

/**
 * 获取认证状态
 */
export function useSharedAuth() {
  const props = useQiankunProps()
  const authState = props.getAuthState?.() || {}

  return {
    isAuthenticated: authState.isAuthenticated || false,
    accessToken: authState.accessToken || null
  }
}

/**
 * 获取主题状态
 */
export function useSharedTheme() {
  const props = useQiankunProps()
  const themeState = props.getThemeState?.() || {}

  return {
    mode: themeState.mode || 'light',
    isDark: themeState.isDark || false
  }
}

/**
 * 获取全局事件总线
 */
export function useGlobalEventBus() {
  const props = useQiankunProps()
  const eventBus = props.eventBus || {
    emit: () => {},
    on: () => {},
    off: () => {}
  }

  return eventBus
}
