import type { FilterDateRange } from '@common-crm/components'

export type UserStatus = 'active' | 'disabled'

export interface UserListItem {
  userId: string
  username: string
  email: string | null
  status: UserStatus
  updatedAt: string
}

export interface UserFilters {
  keyword: string
  status: UserStatus | ''
  updatedAt: FilterDateRange
}
