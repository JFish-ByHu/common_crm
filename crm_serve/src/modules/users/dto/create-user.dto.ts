import type { CreateUserRequest } from '@common-crm/types/api'
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

export class CreateUserDto implements CreateUserRequest {
  /** 上传后取得的头像文件 ID，保存时校验归属并绑定。 */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  avatarFileId?: string | null

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  username!: string

  /** 至少 6 个字符，UTF-8 最多 72 字节，避免 bcrypt 静默截断。 */
  @IsString()
  @MinLength(6)
  @IsByteLength(0, 72)
  password!: string

  /** 可省略；空字符串或 null 表示无邮箱。 */
  @Transform(normalizeEmail)
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null

  /** 省略时创建正常账号。 */
  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @IsIn(Object.values(AccountStatus))
  accountStatus?: AccountStatusValue
}
