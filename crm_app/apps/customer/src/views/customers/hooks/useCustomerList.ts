import { ref } from 'vue'
import type { CustomerListItem } from '../types'

/** 管理客户列表状态，为后续接入分页接口保留页面边界。 */
export function useCustomerList() {
  const customers = ref<CustomerListItem[]>([])

  return { customers }
}
