import { Injectable } from '@nestjs/common'
import { Result, StatusCode, type StatusDefinition } from '../../common'
import { AuthApplicationError, type AuthApplicationErrorCode } from './auth.error'

/** 将认证业务结果转换为统一 HTTP 响应。 */
@Injectable()
export class AuthResultPresenter {
  /**
   * 将已知认证错误转换为统一响应，未知错误交给 Nest 全局处理。
   *
   * @param operation 待执行的认证操作
   * @returns 统一响应结果
   * @throws Error 未知错误继续交由 Nest 全局异常处理
   */
  async present<T>(operation: () => T | Promise<T>): Promise<Result<T>> {
    try {
      const data = await operation()
      return Result.success<T>(data === undefined ? null : data)
    } catch (error) {
      if (!(error instanceof AuthApplicationError)) throw error
      return Result.failure(this.toStatus(error.code))
    }
  }

  private toStatus(code: AuthApplicationErrorCode): StatusDefinition {
    switch (code) {
      case 'INVALID_INPUT':
      case 'PASSWORD_UNCHANGED':
        return StatusCode.BAD_REQUEST
      case 'INVALID_CREDENTIALS':
      case 'INVALID_REFRESH_TOKEN':
      case 'ACCOUNT_UNAVAILABLE':
        return StatusCode.UNAUTHORIZED
    }
  }
}
