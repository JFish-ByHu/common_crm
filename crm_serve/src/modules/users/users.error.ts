import { UserErrors } from '@common-crm/errors'
import { BusinessError } from '../../common'

export type UsersErrorCode = keyof typeof UserErrors

export class UsersError extends BusinessError {
  constructor(key: UsersErrorCode) {
    super(UserErrors[key])
    this.name = 'UsersError'
  }
}
