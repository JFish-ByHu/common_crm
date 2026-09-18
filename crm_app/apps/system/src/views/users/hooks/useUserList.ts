import { computed, reactive, ref } from 'vue'
import type { UserFilters, UserListItem } from '../types'

const createFilters = (): UserFilters => ({ keyword: '', status: '' })

/** 管理用户列表的筛选状态，为后续接入分页接口保留稳定边界。 */
export function useUserList() {
  const filters = reactive<UserFilters>(createFilters())
  const appliedFilters = ref<UserFilters>(createFilters())
  const users = ref<UserListItem[]>([])

  const visibleUsers = computed(() => {
    const keyword = appliedFilters.value.keyword.trim().toLowerCase()
    return users.value.filter(user => {
      const matchesKeyword =
        !keyword ||
        user.username.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword)
      const matchesStatus =
        !appliedFilters.value.status || user.status === appliedFilters.value.status
      return matchesKeyword && matchesStatus
    })
  })

  const applyFilters = () => {
    appliedFilters.value = { ...filters }
  }

  const resetFilters = () => {
    Object.assign(filters, createFilters())
    appliedFilters.value = createFilters()
  }

  return {
    filters,
    visibleUsers,
    applyFilters,
    resetFilters
  }
}
