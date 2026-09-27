import { watch } from 'vue'
import { getCurrentUser } from '@common-crm/api'
import { notifyRequestError } from '@common-crm/utils'
import { useAuthStore } from '../../stores'

/** 基座按会话加载一次资料；用户编辑成功通过微应用回调同步。 */
export const useCurrentUser = () => {
  const auth = useAuthStore()
  watch(
    () => auth.accessToken,
    async (token, _previous, onCleanup) => {
      auth.setCurrentUser(null)
      if (!token) return
      const controller = new AbortController()
      onCleanup(() => controller.abort())
      try {
        const result = await getCurrentUser({ signal: controller.signal, showProgress: false })
        if (!controller.signal.aborted && auth.accessToken === token)
          auth.setCurrentUser(result.data)
      } catch (error) {
        if (!controller.signal.aborted && auth.accessToken === token)
          notifyRequestError(error, {
            title: '个人资料加载失败',
            message: '个人资料暂时不可用，请刷新重试'
          })
      }
    },
    { immediate: true }
  )
}
