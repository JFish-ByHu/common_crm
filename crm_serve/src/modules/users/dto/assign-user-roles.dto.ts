import type { AssignUserRolesRequest } from '@common-crm/types/api'
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength
} from 'class-validator'
import { UserIdDto } from './user-id.dto'

export class AssignUserRolesDto extends UserIdDto implements AssignUserRolesRequest {
  /** 完整替换；允许空数组解除全部分配。 */
  @IsArray()
  @ArrayMaxSize(1000)
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(64, { each: true })
  roleIds!: string[]
}
