import { BusinessError } from '../../common'

export const rejectPermissionInput = (definition: {
  code: number
  httpStatus: number
  msg: string
}): never => {
  throw new BusinessError(definition)
}
