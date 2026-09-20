import { Transform } from 'class-transformer'
import { IsIn, IsInt, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator'
import { AccountStatus, type AccountStatusValue } from '../types'
import { queryInteger, trimString } from './transforms'

/** 两项均省略时不分页；只传一项时，另一项分别使用 1 和 20。 */
export class UserPaginationDto {
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
}

export class UserListQueryDto extends UserPaginationDto {
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

export class UserOptionsQueryDto extends UserPaginationDto {
  /** 按用户名模糊查询。 */
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @MaxLength(64)
  username?: string
}
