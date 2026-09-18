import { Injectable } from '@nestjs/common'
import { AuthApplicationError, type AuthApplicationErrorCode } from '../../../application'
import { Result, StatusCode, type StatusDefinition } from '../../../../../shared/presentation/http'

@Injectable()
export class AuthResultPresenter {
  /**
   * 将应用用例结果和已知错误转换为统一 HTTP 响应结构。
   *
   * @param operation 待执行的应用用例
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
