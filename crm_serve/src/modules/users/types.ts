import type { OnlineStatus } from '../presence'

export const AccountStatus = {
  DISABLED: 0,
  ACTIVE: 1
} as const

export type AccountStatusValue = (typeof AccountStatus)[keyof typeof AccountStatus]

/** 用户仓储使用的公开字段，时间保持数据库毫秒时间戳类型。 */
export interface StoredUserListItem {
  userId: string
  username: string
  email: string | null
  accountStatus: number
  createTime: bigint
  updateTime: bigint
}

/** 用户管理接口的公开字段，时间由服务端统一格式化。 */
export interface UserListItem extends Omit<StoredUserListItem, 'createTime' | 'updateTime'> {
  onlineStatus: OnlineStatus
  createTime: string
  updateTime: string
}

export type UserOption = Pick<StoredUserListItem, 'userId' | 'username' | 'accountStatus'>

export interface UserListResult<T> {
  list: T[]
  total: number
  /** 未启用分页时为 null。 */
  page: number | null
  pageSize: number | null
}

export interface UserPagination {
  page: number
  pageSize: number
}

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
