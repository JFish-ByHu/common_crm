import type { DeleteUserRequest } from '@common-crm/types/api'
import { Transform } from 'class-transformer'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'
import { trimString } from '../../../common'

export class UserIdDto implements DeleteUserRequest {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  userId!: string
}
