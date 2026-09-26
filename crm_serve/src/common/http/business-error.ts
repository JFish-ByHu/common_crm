interface ErrorDefinition {
  readonly code: number
  readonly httpStatus: number
  readonly msg: string | ((...args: never[]) => string)
}

type ErrorArguments<D extends ErrorDefinition> = D['msg'] extends (...args: infer P) => string
  ? P
  : []

/** 可公开展示的业务异常；只接受错误目录定义，文案参数在编译时校验。 */
export class BusinessError<D extends ErrorDefinition = ErrorDefinition> extends Error {
  readonly code: number
  readonly httpStatus: number

  constructor(definition: D, ...args: ErrorArguments<D>) {
    super(
      typeof definition.msg === 'string' ? definition.msg : definition.msg(...(args as never[]))
    )
    this.name = 'BusinessError'
    this.code = definition.code
    this.httpStatus = definition.httpStatus
  }
}
