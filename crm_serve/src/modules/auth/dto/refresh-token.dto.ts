import type { RefreshTokenRequest } from '@common-crm/types/api'
import { IsJWT, IsNotEmpty, IsString } from 'class-validator'

/** Token 刷新请求参数。 */
export class RefreshTokenDto implements RefreshTokenRequest {
  /** 当前 refresh token。 */
  @IsString()
  @IsNotEmpty()
  @IsJWT()
  refreshToken!: string
}
