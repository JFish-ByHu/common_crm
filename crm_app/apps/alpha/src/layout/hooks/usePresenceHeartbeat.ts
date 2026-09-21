import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { sendHeartbeat } from '../../services'
import { useAuthStore } from '../../stores'

const HEARTBEAT_INTERVAL_MS = 60000
const RECOVERY_THROTTLE_MS = 5000

/** 由基座维护心跳，切换子应用不会重建定时器。 */
export const usePresenceHeartbeat = () => {
  const authStore = useAuthStore()
  const router = useRouter()
  let timer: ReturnType<typeof setTimeout> | undefined
  let requestController: AbortController | undefined
  let mounted = false
  let paused = false
  let lastSentAt = 0

  const stopHeartbeat = () => {
    clearTimeout(timer)
    requestController?.abort()
    requestController = undefined
  }

  const canSendHeartbeat = () => mounted && !paused && authStore.isAuthenticated && navigator.onLine

  const recordHeartbeat = async () => {
    if (!canSendHeartbeat() || requestController) return
    clearTimeout(timer)
    const controller = new AbortController()
    requestController = controller
    lastSentAt = Date.now()
    try {
      await sendHeartbeat({ signal: controller.signal })
    } catch {
      // 网络错误等下一次心跳恢复；认证失效由统一请求层处理。
    } finally {
      if (requestController === controller) {
        requestController = undefined
        if (canSendHeartbeat()) timer = setTimeout(recordHeartbeat, HEARTBEAT_INTERVAL_MS)
      }
    }
  }

  const recoverHeartbeat = () => {
    if (!canSendHeartbeat() || requestController) return
    clearTimeout(timer)
    const delay = Math.max(0, RECOVERY_THROTTLE_MS - (Date.now() - lastSentAt))
    if (delay === 0) void recordHeartbeat()
    else timer = setTimeout(recordHeartbeat, delay)
  }

  const resumeVisibleHeartbeat = () => {
    if (!document.hidden) recoverHeartbeat()
  }

  const syncStoredSession = (event: StorageEvent) => {
    if (event.storageArea !== localStorage) return
    authStore.syncTokensFromStorage()
    if (!authStore.isAuthenticated && mounted) {
      void router.replace({
        path: '/login',
        query: { redirect: router.currentRoute.value.fullPath }
      })
    }
  }

  const pauseHeartbeat = () => {
    paused = true
    stopHeartbeat()
  }

  const resumeHeartbeat = () => {
    paused = false
    recoverHeartbeat()
  }

  watch(
    () => authStore.accessToken,
    accessToken => {
      stopHeartbeat()
      lastSentAt = 0
      if (accessToken) void recordHeartbeat()
    }
  )

  onMounted(() => {
    mounted = true
    window.addEventListener('online', recoverHeartbeat)
    window.addEventListener('offline', stopHeartbeat)
    window.addEventListener('storage', syncStoredSession)
    document.addEventListener('visibilitychange', resumeVisibleHeartbeat)
    // 后台标签页仍尽力续期；系统休眠或浏览器冻结最终由 Redis TTL 判离线。
    void recordHeartbeat()
  })

  onBeforeUnmount(() => {
    mounted = false
    stopHeartbeat()
    window.removeEventListener('online', recoverHeartbeat)
    window.removeEventListener('offline', stopHeartbeat)
    window.removeEventListener('storage', syncStoredSession)
    document.removeEventListener('visibilitychange', resumeVisibleHeartbeat)
  })

  return { pauseHeartbeat, resumeHeartbeat }
}
