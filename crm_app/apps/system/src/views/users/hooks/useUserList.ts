import { computed, ref } from 'vue'
import type { UserFilters, UserListItem } from '../types'

const createFilters = (): UserFilters => ({ keyword: '', status: '', updatedAt: null })

/** 管理用户列表的筛选状态，为后续接入分页接口保留稳定边界。 */
export function useUserList() {
  const filters = ref<UserFilters>(createFilters())
  const appliedFilters = ref<UserFilters>(createFilters())
  const users = ref<UserListItem[]>([])
  const currentPage = ref(1)
  const pageSize = ref(10)

  const visibleUsers = computed(() => {
    const keyword = appliedFilters.value.keyword.trim().toLowerCase()
    return users.value.filter(user => {
      const matchesKeyword =
        !keyword ||
        user.username.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword)
      const matchesStatus =
        !appliedFilters.value.status || user.status === appliedFilters.value.status
      const range = appliedFilters.value.updatedAt
      const updatedAt = new Date(user.updatedAt).getTime()
      const matchesTime =
        !range || (updatedAt >= range[0].getTime() && updatedAt <= range[1].getTime())
      return matchesKeyword && matchesStatus && matchesTime
    })
  })

  const applyFilters = () => {
    appliedFilters.value = { ...filters.value }
    currentPage.value = 1
  }

  const resetFilters = () => {
    filters.value = createFilters()
    appliedFilters.value = createFilters()
    currentPage.value = 1
  }

  return {
    filters,
    users,
    currentPage,
    pageSize,
    visibleUsers,
    applyFilters,
    resetFilters
  }
}
