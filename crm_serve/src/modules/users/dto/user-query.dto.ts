import type { QueryUserListRequest, QueryUserSelectListRequest } from '@common-crm/types/api'
import { Transform } from 'class-transformer'
import { IsIn, IsInt, IsString, MaxLength, ValidateIf } from 'class-validator'
import { AccountStatus, type AccountStatusValue } from '../types'
import { PaginationDto, queryInteger, trimString } from '../../../common'

export class UserListQueryDto extends PaginationDto implements QueryUserListRequest {
  /** 对 userId、username、email 进行 OR 模糊匹配。 */
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @MaxLength(255)
  keyword?: string

  /** 与关键字条件按 AND 组合，0 停用、1 正常。 */
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(queryInteger)
  @IsInt()
  @IsIn(Object.values(AccountStatus))
  accountStatus?: AccountStatusValue
}

export class UserOptionsQueryDto extends PaginationDto implements QueryUserSelectListRequest {
  /** 按用户名模糊查询。 */
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @MaxLength(64)
  username?: string
}
