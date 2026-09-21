import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'
import { queryUsersOnlineStatus } from '../../../services'
import type { UserListItem, UserOnlineStatus } from '../types'

const POLL_INTERVAL_MS = 30000
const BATCH_SIZE = 100

/** 静默更新当前列表对象上的状态，保留表格选择和详情引用。 */
export const useUserPresence = (
  users: Ref<UserListItem[]>,
  busy: Readonly<Ref<boolean>>,
  currentPage: Ref<number>,
  pageSize: Ref<number>
) => {
  let mounted = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let requestController: AbortController | undefined

  const canQueryPresence = () =>
    mounted && !busy.value && !document.hidden && navigator.onLine && users.value.length > 0

  const stopPolling = () => {
    clearTimeout(timer)
    requestController?.abort()
    requestController = undefined
  }

  const markStatusUnknown = () => {
    for (const user of users.value) user.onlineStatus = user.accountStatus === 0 ? 0 : null
  }

  const schedulePolling = () => {
    if (canQueryPresence()) timer = setTimeout(refreshOnlineStatus, POLL_INTERVAL_MS)
  }

  const refreshOnlineStatus = async () => {
    if (!canQueryPresence() || requestController) return
    clearTimeout(timer)
    const controller = new AbortController()
    requestController = controller
    const rows = users.value
    try {
      for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
        const batch = rows.slice(offset, offset + BATCH_SIZE)
        const { data } = await queryUsersOnlineStatus(
          batch.map(user => user.userId),
          { signal: controller.signal }
        )
        if (controller.signal.aborted || users.value !== rows) return
        if (!data) throw new Error('用户在线状态响应为空')
        const statuses = new Map<string, UserOnlineStatus>(
          data.map(user => [user.userId, user.onlineStatus])
        )
        for (const user of batch) {
          // 已删除的用户不在响应中，其旧列表记录按离线展示。
          user.onlineStatus = statuses.has(user.userId) ? (statuses.get(user.userId) ?? null) : 0
        }
      }
    } catch {
      if (!controller.signal.aborted && users.value === rows) markStatusUnknown()
    } finally {
      if (requestController === controller) {
        requestController = undefined
        schedulePolling()
      }
    }
  }

  const resetPolling = () => {
    stopPolling()
    schedulePolling()
  }

  const resumePolling = () => {
    stopPolling()
    if (canQueryPresence()) void refreshOnlineStatus()
  }

  const suspendOfflinePolling = () => {
    stopPolling()
    markStatusUnknown()
  }

  // flush: sync 在列表请求开始时立即中止旧轮询，避免同一轮事件中写入旧数据。
  watch([users, busy, currentPage, pageSize], resetPolling, { flush: 'sync' })

  onMounted(() => {
    mounted = true
    document.addEventListener('visibilitychange', resumePolling)
    window.addEventListener('online', resumePolling)
    window.addEventListener('offline', suspendOfflinePolling)
    schedulePolling()
  })

  onBeforeUnmount(() => {
    mounted = false
    stopPolling()
    document.removeEventListener('visibilitychange', resumePolling)
    window.removeEventListener('online', resumePolling)
    window.removeEventListener('offline', suspendOfflinePolling)
  })
}
