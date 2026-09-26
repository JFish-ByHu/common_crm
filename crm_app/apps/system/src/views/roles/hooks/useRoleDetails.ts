import { onBeforeUnmount, ref, watch } from 'vue'
import { notifyRequestError } from '@common-crm/utils'
import { ApiError, isRequestCanceled, queryRoleDetail } from '../../../services'
import type { RoleListItem } from '../types'

export const useRoleDetails = () => {
  const detailsVisible = ref(false)
  const detailRole = ref<RoleListItem | null>(null)
  const detailLoading = ref(false)
  let roleId = ''
  let controller: AbortController | undefined

  const loadRoleDetails = async () => {
    if (!detailsVisible.value || !roleId) return
    controller?.abort()
    const request = new AbortController()
    controller = request
    detailLoading.value = true
    detailRole.value = null
    try {
      const { data } = await queryRoleDetail(roleId, { signal: request.signal })
      if (request.signal.aborted) return
      if (!data) throw new Error('角色详情响应为空')
      detailRole.value = data
    } catch (error) {
      if (!request.signal.aborted && !isRequestCanceled(error)) {
        notifyRequestError(error, {
          title: '请求失败',
          message: error instanceof ApiError ? error.message : '角色详情加载失败，请稍后重试'
        })
      }
    } finally {
      if (controller === request) detailLoading.value = false
    }
  }
  const openRoleDetails = (role: RoleListItem) => {
    roleId = role.roleId
    detailsVisible.value = true
    void loadRoleDetails()
  }
  watch(detailsVisible, visible => {
    if (!visible) controller?.abort()
  })
  onBeforeUnmount(() => controller?.abort())
  return { detailsVisible, detailRole, detailLoading, openRoleDetails, loadRoleDetails }
}
