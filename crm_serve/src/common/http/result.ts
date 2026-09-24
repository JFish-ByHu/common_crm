import type { ApiResponse } from '@common-crm/types/api'
import { StatusCode, type StatusDefinition } from './status-code'

export class Result<T = unknown> implements ApiResponse<T> {
  constructor(
    public readonly code: number,
    public readonly data: T | null,
    public readonly msg: string
  ) {}

  static success<T = unknown>(data: T | null = null, msg = StatusCode.SUCCESS.msg) {
    return new Result(StatusCode.SUCCESS.code, data, msg)
  }

  static failure<T = unknown>(
    status: StatusDefinition = StatusCode.INTERNAL_SERVER_ERROR,
    data: T | null = null,
    msg = status.msg
  ) {
    return new Result(status.code, data, msg)
  }
}
