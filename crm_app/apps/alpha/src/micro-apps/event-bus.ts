import type { MicroAppEventBus, MicroAppEventHandler } from '@common-crm/types'

/** 创建供所有业务子应用共享的浏览器事件总线。 */
export function createMicroAppEventBus(): MicroAppEventBus {
  const listeners = new Map<string, Map<MicroAppEventHandler, EventListener>>()

  return {
    emit(event, data) {
      window.dispatchEvent(new CustomEvent(`qiankun:${event}`, { detail: data }))
    },
    on(event, handler) {
      const eventListeners = listeners.get(event) ?? new Map()
      if (eventListeners.has(handler)) return

      const listener: EventListener = nativeEvent => {
        handler((nativeEvent as CustomEvent<unknown>).detail)
      }
      eventListeners.set(handler, listener)
      listeners.set(event, eventListeners)
      window.addEventListener(`qiankun:${event}`, listener)
    },
    off(event, handler) {
      const eventListeners = listeners.get(event)
      if (!eventListeners) return

      const listener = eventListeners.get(handler)
      if (!listener) return

      window.removeEventListener(`qiankun:${event}`, listener)
      eventListeners.delete(handler)
      if (eventListeners.size === 0) listeners.delete(event)
    }
  }
}
