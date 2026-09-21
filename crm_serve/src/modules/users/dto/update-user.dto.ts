import { Transform } from 'class-transformer'
import {
  IsByteLength,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf
} from 'class-validator'
import { normalizeEmail, trimString } from './transforms'
import { UserIdDto } from './user-id.dto'

/** 仅更新传入的字段；账号状态通过独立接口修改。 */
export class UpdateUserDto extends UserIdDto {
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
}
