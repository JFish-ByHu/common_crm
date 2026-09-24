import type { BatchDeleteRolesRequest } from '@common-crm/types/api'
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength
} from 'class-validator'

export class DeleteRolesDto implements BatchDeleteRolesRequest {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(64, { each: true })
  roleIds!: string[]
}
