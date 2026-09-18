import type { UserAccount } from '../entities'

export const USER_REPOSITORY = Symbol('USER_REPOSITORY')

/** 用户账号持久化端口。 */
export interface UserRepository {
  findById(userId: string): Promise<UserAccount | null>
  findByUsername(username: string): Promise<UserAccount | null>
}
