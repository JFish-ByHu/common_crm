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
import { normalizeRemark, trimString } from './transforms'

export class UpdateRoleDto extends RoleIdDto {
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

export class UpdateRoleStatusDto extends RoleIdDto {
  @IsInt()
  @IsIn(Object.values(RoleStatus))
  roleStatus!: RoleStatusValue
}
