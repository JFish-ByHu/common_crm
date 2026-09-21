import { onBeforeUnmount, onMounted, ref } from 'vue'
import { isRequestCanceled, queryUserList } from '../../../services'
import { Notification } from '@common-crm/utils'
import type { UserFilters, UserListItem } from '../types'
import { getUserErrorMessage } from '../utils'

const createFilters = (): UserFilters => ({ keyword: '', accountStatus: '' })

/** 管理服务端分页、已提交的筛选条件与列表请求。 */
export const useUserList = () => {
  const filters = ref<UserFilters>(createFilters())
  const appliedFilters = ref<UserFilters>(createFilters())
  const users = ref<UserListItem[]>([])
  const selectedUsers = ref<UserListItem[]>([])
  const currentPage = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const loading = ref(false)
  let requestController: AbortController | undefined
  let disposed = false

  const refreshUserList = async (): Promise<boolean> => {
    if (disposed) return false
    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    loading.value = true
    selectedUsers.value = []

    try {
      const { data } = await queryUserList(
        {
          keyword: appliedFilters.value.keyword.trim() || undefined,
          accountStatus:
            appliedFilters.value.accountStatus === ''
              ? undefined
              : appliedFilters.value.accountStatus,
          page: currentPage.value,
          pageSize: pageSize.value
        },
        { signal: controller.signal }
      )
      if (controller.signal.aborted || requestController !== controller) return false
      if (!data) throw new Error('用户列表响应为空')

      // 删除当前页最后一条记录后，回到仍然有数据的最后一页。
      const lastPage = Math.max(1, Math.ceil(data.total / pageSize.value))
      if (currentPage.value > lastPage) {
        currentPage.value = lastPage
        return await refreshUserList()
      }
      users.value = data.list
      total.value = data.total
      return true
    } catch (error) {
      if (controller.signal.aborted || isRequestCanceled(error)) return false
      users.value = []
      total.value = 0
      Notification.error({
        title: '请求失败',
        message: getUserErrorMessage(error, '用户列表加载失败，请稍后重试')
      })
      return false
    } finally {
      if (requestController === controller) loading.value = false
    }
  }

  const searchUsers = () => {
    appliedFilters.value = { ...filters.value }
    currentPage.value = 1
    return refreshUserList()
  }

  const resetUserFilters = () => {
    filters.value = createFilters()
    return searchUsers()
  }

  const selectUsers = (rows: UserListItem[]) => {
    selectedUsers.value = rows
  }

  onMounted(refreshUserList)
  onBeforeUnmount(() => {
    disposed = true
    requestController?.abort()
  })

  return {
    filters,
    users,
    selectedUsers,
    currentPage,
    pageSize,
    total,
    loading,
    refreshUserList,
    searchUsers,
    resetUserFilters,
    selectUsers
  }
}
