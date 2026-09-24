import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Notification } from '@common-crm/utils'
import { ApiError, isRequestCanceled, queryRoleList } from '../../../services'
import type { RoleFilters, RoleListItem } from '../types'

const createFilters = (): RoleFilters => ({ keyword: '', roleStatus: '' })

export const useRoleList = () => {
  const filters = ref(createFilters())
  const appliedFilters = ref(createFilters())
  const roles = ref<RoleListItem[]>([])
  const selectedRoles = ref<RoleListItem[]>([])
  const currentPage = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const loading = ref(false)
  let controller: AbortController | undefined
  let disposed = false

  const refreshRoleList = async (): Promise<boolean> => {
    if (disposed) return false
    controller?.abort()
    const request = new AbortController()
    controller = request
    loading.value = true
    selectedRoles.value = []
    try {
      const { data } = await queryRoleList(
        {
          keyword: appliedFilters.value.keyword.trim() || undefined,
          roleStatus:
            appliedFilters.value.roleStatus === '' ? undefined : appliedFilters.value.roleStatus,
          page: currentPage.value,
          pageSize: pageSize.value
        },
        { signal: request.signal }
      )
      if (request.signal.aborted || controller !== request) return false
      if (!data) throw new Error('角色列表响应为空')
      const lastPage = Math.max(1, Math.ceil(data.total / pageSize.value))
      if (currentPage.value > lastPage) {
        currentPage.value = lastPage
        return await refreshRoleList()
      }
      roles.value = data.list
      total.value = data.total
      return true
    } catch (error) {
      if (request.signal.aborted || isRequestCanceled(error)) return false
      roles.value = []
      total.value = 0
      Notification.error({
        title: '请求失败',
        message: error instanceof ApiError ? error.message : '角色列表加载失败，请稍后重试'
      })
      return false
    } finally {
      if (controller === request) loading.value = false
    }
  }
  const searchRoles = () => {
    appliedFilters.value = { ...filters.value }
    currentPage.value = 1
    return refreshRoleList()
  }
  const resetRoleFilters = () => {
    filters.value = createFilters()
    return searchRoles()
  }
  const selectRoles = (rows: RoleListItem[]) => {
    selectedRoles.value = rows
  }
  onMounted(refreshRoleList)
  onBeforeUnmount(() => {
    disposed = true
    controller?.abort()
  })
  return {
    filters,
    roles,
    selectedRoles,
    currentPage,
    pageSize,
    total,
    loading,
    refreshRoleList,
    searchRoles,
    resetRoleFilters,
    selectRoles
  }
}
