import { onBeforeUnmount, ref, watch } from 'vue'
import { Notification } from '@common-crm/utils'
import { isRequestCanceled, queryUserPermissions } from '../../../services'
import { getUserErrorMessage } from '../utils'
import type { UserListItem, UserPermissionsResponse } from '../types'

/** 抽屉打开时查询，关闭或切换用户时取消旧请求。 */
export const useUserPermissions = () => {
  const permissionsVisible = ref(false)
  const permissionUser = ref<UserListItem | null>(null)
  const permissions = ref<UserPermissionsResponse | null>(null)
  const permissionsLoading = ref(false)
  let controller: AbortController | undefined
  let disposed = false

  const loadUserPermissions = async () => {
    const user = permissionUser.value
    if (disposed || !permissionsVisible.value || !user) return
    controller?.abort()
    const request = new AbortController()
    controller = request
    permissions.value = null
    permissionsLoading.value = true
    try {
      const { data } = await queryUserPermissions(user.userId, {
        signal: request.signal,
        showProgress: false
      })
      if (request.signal.aborted || controller !== request || disposed) return
      if (!data) throw new Error('用户权限响应为空')
      permissions.value = data
    } catch (error) {
      if (
        !request.signal.aborted &&
        controller === request &&
        !disposed &&
        !isRequestCanceled(error)
      ) {
        Notification.error({
          title: '请求失败',
          message: getUserErrorMessage(error, '用户权限加载失败，请稍后重试')
        })
      }
    } finally {
      if (controller === request) permissionsLoading.value = false
    }
  }

  const openUserPermissions = (user: UserListItem) => {
    if (disposed) return
    permissionUser.value = user
    permissionsVisible.value = true
    void loadUserPermissions()
  }

  watch(
    permissionsVisible,
    visible => {
      if (!visible) {
        controller?.abort()
        permissions.value = null
      }
    },
    { flush: 'sync' }
  )
  onBeforeUnmount(() => {
    disposed = true
    controller?.abort()
  })

  return {
    permissionsVisible,
    permissionUser,
    permissions,
    permissionsLoading,
    openUserPermissions,
    loadUserPermissions
  }
}
