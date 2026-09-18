import { AccountStatus } from '../value-objects'

export interface UserAccountProps {
  userId: string
  username: string
  passwordHash: string
  email: string | null
  accountStatus: AccountStatus
}

/** IAM 用户账号聚合。 */
export class UserAccount {
  constructor(private readonly props: UserAccountProps) {}

  get userId() {
    return this.props.userId
  }

  get username() {
    return this.props.username
  }

  get passwordHash() {
    return this.props.passwordHash
  }

  get email() {
    return this.props.email
  }

  get accountStatus() {
    return this.props.accountStatus
  }

  /**
   * 判断账号是否允许参与认证。
   *
   * @returns 账号处于启用状态时返回 true
   */
  isActive() {
    return this.props.accountStatus === AccountStatus.ACTIVE
  }
}
