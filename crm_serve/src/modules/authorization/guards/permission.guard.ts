import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import type { Request } from 'express'
import { AccessTokenGuard } from '../../auth'
import { AuthorizationService } from '../services'
import { PUBLIC_ENDPOINTS, SESSION_ENDPOINTS } from '../types'

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly authentication: AccessTokenGuard,
    private readonly authorization: AuthorizationService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user: { userId: string } }>()
    // Express supplies the matched template, not the user-controlled URL/query string.
    const routePath = (request.route as { path: string }).path
    const path = routePath.replace(/^\/api(?=\/|$)/, '').replace(/\/$/, '') || '/'
    const key = `${request.method} ${path}`
    if (PUBLIC_ENDPOINTS.has(key)) return true
    await this.authentication.canActivate(context)
    if (!SESSION_ENDPOINTS.has(key))
      await this.authorization.assertAllowed(request.user.userId, request.method, path)
    return true
  }
}
