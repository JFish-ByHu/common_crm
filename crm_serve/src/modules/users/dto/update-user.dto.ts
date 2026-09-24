import type { UpdateUserRequest } from '@common-crm/types/api'
import { Transform } from 'class-transformer'
import {
  IsByteLength,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf
} from 'class-validator'
import { AccountStatus, type AccountStatusValue } from '../types'
import { trimString } from '../../../common'
import { normalizeEmail } from './transforms'
import { UserIdDto } from './user-id.dto'

/** 仅更新传入的字段，资料和账号状态在同一事务中保存。 */
export class UpdateUserDto extends UserIdDto implements UpdateUserRequest {
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  username?: string

  /** 管理端重设密码，成功后撤销该用户的全部登录会话。 */
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MinLength(6)
  @IsByteLength(0, 72)
  password?: string

  /** 省略不修改，空字符串或 null 清空邮箱。 */
  @Transform(normalizeEmail)
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null

  /** 省略不修改；0 停用、1 正常，停用时撤销全部登录会话。 */
  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @IsIn(Object.values(AccountStatus))
  accountStatus?: AccountStatusValue
}
