import { HttpException } from '@nestjs/common'
import { Result } from '../../common'

export const rejectPermissionInput = (message: string, code = 400): never => {
  throw new HttpException(new Result(code, null, message), code)
}
