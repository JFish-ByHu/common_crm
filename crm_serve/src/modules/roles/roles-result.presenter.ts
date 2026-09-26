import { Injectable } from '@nestjs/common'
import { Result } from '../../common'

/** 只包装成功结果；业务异常由全局过滤器统一转换。 */
@Injectable()
export class RolesResultPresenter {
  async present<T>(operation: () => T | Promise<T>): Promise<Result<T>> {
    const data = await operation()
    return Result.success<T>(data === undefined ? null : data)
  }
}
