import { computed, ref } from 'vue'
import type { CustomerFilters, CustomerListItem } from '../types'

const createFilters = (): CustomerFilters => ({ keyword: '', updatedAt: null })

/** 管理客户列表状态，为后续接入分页接口保留页面边界。 */
export function useCustomerList() {
  const filters = ref<CustomerFilters>(createFilters())
  const appliedFilters = ref<CustomerFilters>(createFilters())
  const customers = ref<CustomerListItem[]>([])
  const currentPage = ref(1)
  const pageSize = ref(10)

  const visibleCustomers = computed(() => {
    const keyword = appliedFilters.value.keyword.trim().toLowerCase()
    return customers.value.filter(customer => {
      const matchesKeyword =
        !keyword ||
        [customer.name, customer.contactName, customer.phone]
          .filter((value): value is string => Boolean(value))
          .some(value => value.toLowerCase().includes(keyword))
      const range = appliedFilters.value.updatedAt
      const updatedAt = new Date(customer.updatedAt).getTime()
      const matchesTime =
        !range || (updatedAt >= range[0].getTime() && updatedAt <= range[1].getTime())
      return matchesKeyword && matchesTime
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
    customers,
    currentPage,
    pageSize,
    visibleCustomers,
    applyFilters,
    resetFilters
  }
}
