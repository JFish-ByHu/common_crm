import type { DeleteRoleRequest } from '@common-crm/types/api'
import { Transform } from 'class-transformer'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'
import { trimString } from '../../../common'

export class RoleIdDto implements DeleteRoleRequest {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  roleId!: string
}
