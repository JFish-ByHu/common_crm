import type { UpdateRoleRequest, UpdateRoleStatusRequest } from '@common-crm/types/api'
import { Transform } from 'class-transformer'
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf
} from 'class-validator'
import { RoleStatus, type RoleStatusValue } from '../types'
import { RoleIdDto } from './role-id.dto'
import { trimString } from '../../../common'
import { normalizeRemark } from './transforms'

export class UpdateRoleDto extends RoleIdDto implements UpdateRoleRequest {
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  roleName?: string

  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @IsIn(Object.values(RoleStatus))
  roleStatus?: RoleStatusValue

  @Transform(normalizeRemark)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string | null
}

export class UpdateRoleStatusDto extends RoleIdDto implements UpdateRoleStatusRequest {
  @IsInt()
  @IsIn(Object.values(RoleStatus))
  roleStatus!: RoleStatusValue
}
