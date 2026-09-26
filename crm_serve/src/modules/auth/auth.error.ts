import { AuthErrors } from '@common-crm/errors'
import { BusinessError } from '../../common'

export type AuthApplicationErrorCode = keyof typeof AuthErrors

/** 可由 HTTP 层转换为统一响应的认证业务错误。 */
export class AuthApplicationError extends BusinessError {
  constructor(key: AuthApplicationErrorCode) {
    super(AuthErrors[key])
    this.name = 'AuthApplicationError'
  }
}
