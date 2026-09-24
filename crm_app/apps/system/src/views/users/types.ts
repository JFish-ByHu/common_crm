import type { UserAccountStatus } from '@common-crm/types/api'

export type {
  UserAccountStatus,
  UserListItem,
  UserOnlineStatus,
  UserPermissionsResponse,
  UserPermissionMenu,
  RoleSelectItem
} from '@common-crm/types/api'

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
