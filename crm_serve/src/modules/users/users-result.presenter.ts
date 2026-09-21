import { Injectable } from '@nestjs/common'
import { Result, StatusCode } from '../../common'
import { UsersError } from './users.error'

const statuses = {
  INVALID_INPUT: { ...StatusCode.BAD_REQUEST, msg: '用户参数无效或没有可更新的字段' },
  USER_NOT_FOUND: { ...StatusCode.NOT_FOUND, msg: '用户不存在' },
  USER_CONFLICT: { ...StatusCode.CONFLICT, msg: '用户名或邮箱已存在' }
} as const

/** 与认证接口保持一致：业务错误使用统一响应，未知异常交由 Nest 处理。 */
@Injectable()
export class UsersResultPresenter {
  async present<T>(operation: () => Promise<T>): Promise<Result<T>> {
    try {
      return Result.success(await operation())
    } catch (error) {
      if (!(error instanceof UsersError)) throw error
      return Result.failure(statuses[error.code])
    }
  }
}
