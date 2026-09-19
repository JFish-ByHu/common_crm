import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

/** 登录请求参数。 */
export class LoginDto {
  /** 登录用户名。 */
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  username!: string

  /** 登录密码。 */
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password!: string
}
