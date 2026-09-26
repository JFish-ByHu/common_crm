import type { ApiResponse } from '@common-crm/types/api'
import { CommonErrors } from '@common-crm/errors'

export class Result<T = unknown> implements ApiResponse<T> {
  constructor(
    public readonly code: number,
    public readonly data: T | null,
    public readonly msg: string
  ) {}

  static success<T = unknown>(data: T | null = null, msg = 'SUCCESS') {
    return new Result(200, data, msg)
  }

  static failure<T = unknown>(
    status: Pick<ApiResponse, 'code' | 'msg'> = CommonErrors.INTERNAL_ERROR,
    data: T | null = null,
    msg = status.msg
  ) {
    return new Result(status.code, data, msg)
  }
}
