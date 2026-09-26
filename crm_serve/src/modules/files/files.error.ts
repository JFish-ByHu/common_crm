import { BusinessError } from '../../common'

export const rejectFileUpload = <
  D extends { code: number; httpStatus: number; msg: string | ((...args: never[]) => string) }
>(
  definition: D,
  ...args: D['msg'] extends (...params: infer P) => string ? P : []
): never => {
  throw new BusinessError(definition, ...args)
}
