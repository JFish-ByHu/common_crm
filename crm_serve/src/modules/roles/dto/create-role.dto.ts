import type { CreateRoleRequest } from '@common-crm/types/api'
import { Transform } from 'class-transformer'
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf
} from 'class-validator'
import { RoleStatus, type RoleStatusValue } from '../types'
import { trimString } from '../../../common'
import { normalizeRemark } from './transforms'

export class CreateRoleDto implements CreateRoleRequest {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  roleName!: string

  /** 创建后不可修改；小写字母开头，支持数字和下划线。 */
  @Transform(trimString)
  @IsString()
  @Matches(/^[a-z][a-z0-9_]{0,63}$/)
  roleCode!: string

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
