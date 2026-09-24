import { Transform } from 'class-transformer'
import { IsIn, IsInt, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator'
import { RoleStatus, type RoleStatusValue } from '../types'
import { queryInteger, trimString } from './transforms'

/** 不传分页参数查询全部；只传一项时另一项分别默认 1、20。 */
export class RoleQueryDto {
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(queryInteger)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  page?: number

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(queryInteger)
  @IsInt()
  @Min(1)
  @Max(1000)
  pageSize?: number

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
