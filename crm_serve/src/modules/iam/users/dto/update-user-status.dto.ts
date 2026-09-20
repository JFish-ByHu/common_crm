import { IsIn, IsInt } from 'class-validator'
import { AccountStatus, type AccountStatusValue } from '../types'
import { UserIdDto } from './user-id.dto'

export class UpdateUserStatusDto extends UserIdDto {
  /** 0 停用、1 正常。 */
  @IsInt()
  @IsIn(Object.values(AccountStatus))
  accountStatus!: AccountStatusValue
}
