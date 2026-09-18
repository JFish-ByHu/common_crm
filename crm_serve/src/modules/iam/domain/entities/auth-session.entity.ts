export interface AuthSessionProps {
  sessionId: string
  userId: string
  tokenHash: string
  expiresAt: Date
  revokedAt: Date | null
}

/** 用户认证会话聚合。 */
export class AuthSession {
  constructor(private readonly props: AuthSessionProps) {}

  get sessionId() {
    return this.props.sessionId
  }

  get userId() {
    return this.props.userId
  }

  get tokenHash() {
    return this.props.tokenHash
  }

  get expiresAt() {
    return this.props.expiresAt
  }

  get revokedAt() {
    return this.props.revokedAt
  }

  /**
   * 判断会话在指定时间是否有效。
   *
   * @param at 用于判断有效期的时间
   * @returns 会话未撤销且未过期时返回 true
   */
  isActive(at: Date) {
    return this.props.revokedAt === null && this.props.expiresAt > at
  }

  /**
   * 使用安全摘要匹配 refresh token。
   *
   * @param tokenHash refresh token 摘要
   * @returns 摘要一致时返回 true
   */
  matchesTokenHash(tokenHash: string) {
    return this.props.tokenHash === tokenHash
  }
}
