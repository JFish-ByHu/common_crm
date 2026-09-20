import { IsByteLength, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

/** 修改密码请求参数。 */
export class ChangePasswordDto {
  /** 当前密码。 */
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  currentPassword!: string

  /** 新密码至少 6 个字符，UTF-8 最多 72 字节。 */
  @IsString()
  @MinLength(6)
  @IsByteLength(0, 72)
  newPassword!: string
}
