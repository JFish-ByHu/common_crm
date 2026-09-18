import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'
import { ValidateAccessSessionUseCase, type AuthenticatedUser } from '../../../application'
import { Result, StatusCode } from '../../../../../shared/presentation/http'

type AuthenticatedRequest = Request & { user?: AuthenticatedUser }

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly validateAccessSession: ValidateAccessSessionUseCase) {}

  /**
   * 校验 access token、登录会话和用户状态，并向请求对象写入当前用户。
   *
   * @param context Nest 请求执行上下文
   * @returns 校验通过时返回 true
   * @throws UnauthorizedException token、会话或用户状态无效
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = this.extractBearerToken(request.headers.authorization)
    if (!token) this.throwUnauthorized()

    const user = await this.validateAccessSession.execute(token)
    if (!user) this.throwUnauthorized()

    request.user = user
    return true
  }

  private extractBearerToken(authorization: string | undefined) {
    const [scheme, token, extra] = authorization?.trim().split(/\s+/) ?? []
    return scheme === 'Bearer' && token && !extra ? token : null
  }

  private throwUnauthorized(): never {
    throw new UnauthorizedException(Result.failure(StatusCode.UNAUTHORIZED))
  }
}
