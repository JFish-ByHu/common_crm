import { Injectable } from '@nestjs/common'
import { Result, StatusCode } from '../../common'
import { RolesError } from './roles.error'

const statuses = {
  INVALID_INPUT: { ...StatusCode.BAD_REQUEST, msg: '角色参数无效或没有可更新的字段' },
  ROLE_NOT_FOUND: { ...StatusCode.NOT_FOUND, msg: '角色不存在，请刷新后重试' },
  ROLE_CONFLICT: { ...StatusCode.CONFLICT, msg: '角色编码已存在' },
  ROLE_IN_USE: { ...StatusCode.CONFLICT, msg: '角色已分配给用户，请先解除分配后再删除' },
  ROLE_DISABLED: { ...StatusCode.CONFLICT, msg: '不能新增分配停用的角色，请刷新后重试' },
  USER_NOT_FOUND: { ...StatusCode.NOT_FOUND, msg: '用户不存在，请刷新后重试' }
} as const

@Injectable()
export class RolesResultPresenter {
  async present<T>(operation: () => Promise<T>): Promise<Result<T>> {
    try {
      return Result.success(await operation())
    } catch (error) {
      if (!(error instanceof RolesError)) throw error
      return Result.failure(statuses[error.code])
    }
  }
}
