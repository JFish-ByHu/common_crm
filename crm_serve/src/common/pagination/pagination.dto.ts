import { Transform } from 'class-transformer'
import { IsInt, Max, Min, ValidateIf } from 'class-validator'
import type { OptionalPageRequest } from '@common-crm/types/api'
import { queryInteger } from '../validation'
import { MAX_PAGE_OFFSET, MAX_PAGE_SIZE } from './pagination'

/** 两项都不传时查询全部；传任意一项时默认页码 1、每页 20。 */
export class PaginationDto implements OptionalPageRequest {
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(queryInteger)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_OFFSET)
  page?: number

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(queryInteger)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize?: number
}
