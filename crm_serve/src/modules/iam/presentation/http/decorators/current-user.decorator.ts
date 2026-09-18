import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'
import type { AuthenticatedUser } from '../../../application'

type AuthenticatedRequest = Request & { user?: AuthenticatedUser }

/** 从经过 AccessTokenGuard 校验的请求中读取当前用户。 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser | undefined => {
    return context.switchToHttp().getRequest<AuthenticatedRequest>().user
  }
)
