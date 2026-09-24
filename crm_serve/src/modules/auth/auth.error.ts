export type AuthApplicationErrorCode =
  | 'INVALID_INPUT'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_REFRESH_TOKEN'
  | 'ACCOUNT_UNAVAILABLE'
  | 'PASSWORD_UNCHANGED'

/** 可由 HTTP 层转换为统一响应的认证业务错误。 */
export class AuthApplicationError extends Error {
  constructor(public readonly code: AuthApplicationErrorCode) {
    super(code)
    this.name = 'AuthApplicationError'
  }
}
