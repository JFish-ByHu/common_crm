import { RoleErrors, UserErrors } from '@common-crm/errors'
import { BusinessError } from '../../common'

const definitions = { ...RoleErrors, USER_NOT_FOUND: UserErrors.USER_NOT_FOUND }
export type RolesErrorCode = keyof typeof definitions

export class RolesError extends BusinessError {
  constructor(key: RolesErrorCode) {
    super(definitions[key])
    this.name = 'RolesError'
  }
}
