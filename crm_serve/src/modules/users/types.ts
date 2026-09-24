import type { PageRequest, PageResponse, UserAccountStatus } from '@common-crm/types/api'
export type { UserListItem } from '@common-crm/types/api'

export const AccountStatus = {
  DISABLED: 0,
  ACTIVE: 1
} as const satisfies Record<string, UserAccountStatus>

export type AccountStatusValue = UserAccountStatus

/** 用户仓储使用的公开字段，时间保持数据库毫秒时间戳类型。 */
export interface StoredUserListItem {
  userId: string
  username: string
  email: string | null
  accountStatus: number
  createTime: bigint
  updateTime: bigint
}

export type UserOption = Pick<StoredUserListItem, 'userId' | 'username' | 'accountStatus'>

export type UserListResult<T> = PageResponse<T>

export type UserPagination = PageRequest

export interface UserSearch {
  keyword?: string
  username?: string
  accountStatus?: AccountStatusValue
  pagination?: UserPagination
}

export interface CreateUserInput {
  userId: string
  username: string
  email: string | null
  passwordHash: string
  accountStatus: AccountStatusValue
}

export interface UpdateUserInput {
  username?: string
  email?: string | null
  passwordHash?: string
  accountStatus?: AccountStatusValue
}
