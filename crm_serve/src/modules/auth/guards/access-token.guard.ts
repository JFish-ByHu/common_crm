import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import type { Request } from 'express'
import { AuthErrors } from '@common-crm/errors'
import { BusinessError } from '../../../common'
import { AuthService } from '../services'
import type { AuthenticatedUser } from '../types'

type AuthenticatedRequest = Request & { user?: AuthenticatedUser }

/** 校验 access token、会话和用户状态的守卫。 */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  /**
   * 校验 access token 并向请求对象写入当前用户。
   *
   * @param context Nest 请求执行上下文
   * @returns 校验通过时返回 true
   * @throws UnauthorizedException token、会话或用户状态无效
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    if (request.user) return true
    const token = this.extractBearerToken(request.headers.authorization)
    if (!token) this.throwUnauthorized()

    const user = await this.authService.validateAccessSession(token)
    if (!user) this.throwUnauthorized()

    request.user = user
    return true
  }

  private extractBearerToken(authorization: string | undefined): string | null {
    const [scheme, token, extra] = authorization?.trim().split(/\s+/) ?? []
    return scheme === 'Bearer' && token && !extra ? token : null
  }

  private throwUnauthorized(): never {
    throw new BusinessError(AuthErrors.SESSION_EXPIRED)
  }
}
