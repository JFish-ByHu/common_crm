import type { QueryRoleListRequest } from '@common-crm/types/api'
import { Transform } from 'class-transformer'
import { IsIn, IsInt, IsString, MaxLength, ValidateIf } from 'class-validator'
import { RoleStatus, type RoleStatusValue } from '../types'
import { PaginationDto, queryInteger, trimString } from '../../../common'

/** 不传分页参数查询全部；只传一项时另一项分别默认 1、20。 */
export class RoleQueryDto extends PaginationDto implements QueryRoleListRequest {
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @MaxLength(255)
  keyword?: string

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(queryInteger)
  @IsInt()
  @IsIn(Object.values(RoleStatus))
  roleStatus?: RoleStatusValue
}
