export interface StatusDefinition {
  code: number
  msg: string
}

export class StatusCode {
  static readonly SUCCESS = { code: 200, msg: 'SUCCESS' } as const
  static readonly CREATED = { code: 201, msg: 'CREATED' } as const

  static readonly BAD_REQUEST = { code: 400, msg: 'BAD_REQUEST' } as const
  static readonly UNAUTHORIZED = { code: 401, msg: 'UNAUTHORIZED' } as const
  static readonly NO_PERMISSION = { code: 403, msg: 'NO_PERMISSION' } as const
  static readonly NOT_FOUND = { code: 404, msg: 'NOT_FOUND' } as const
  static readonly CONFLICT = { code: 409, msg: 'CONFLICT' } as const
  static readonly VALIDATION_FAILED = { code: 422, msg: 'VALIDATION_FAILED' } as const
  static readonly TOO_MANY_REQUESTS = { code: 429, msg: 'TOO_MANY_REQUESTS' } as const

  static readonly INTERNAL_SERVER_ERROR = { code: 500, msg: 'INTERNAL_SERVER_ERROR' } as const
  static readonly BAD_GATEWAY = { code: 502, msg: 'BAD_GATEWAY' } as const
  static readonly SERVICE_UNAVAILABLE = { code: 503, msg: 'SERVICE_UNAVAILABLE' } as const
}
