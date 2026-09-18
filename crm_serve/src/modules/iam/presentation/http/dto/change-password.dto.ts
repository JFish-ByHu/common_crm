import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

/** 修改密码请求参数。 */
export class ChangePasswordDto {
  /** 当前密码。 */
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  currentPassword!: string

  /** 新密码，长度为 8 至 72 个字符。 */
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string
}
