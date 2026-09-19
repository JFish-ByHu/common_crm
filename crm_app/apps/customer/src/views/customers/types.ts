import type { FilterDateRange } from '@common-crm/components'

export interface CustomerListItem {
  customerId: string
  name: string
  contactName: string | null
  phone: string | null
  updatedAt: string
}

export interface CustomerFilters {
  keyword: string
  updatedAt: FilterDateRange
}
