import type { UserAccountStatus } from '../../services'

export type { UserAccountStatus, UserListItem, UserOnlineStatus } from '../../services'

export interface UserFilters {
  keyword: string
  accountStatus: UserAccountStatus | ''
}

export interface UserFormValues {
  username: string
  email: string
  password: string
  accountStatus: UserAccountStatus
}
