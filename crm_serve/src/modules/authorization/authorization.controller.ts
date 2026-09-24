import { Controller, Get, Req } from '@nestjs/common'
import { Result } from '../../common'
import { AuthorizationService } from './services'

@Controller('authorization')
export class AuthorizationController {
  constructor(private readonly authorization: AuthorizationService) {}

  /** GET /api/authorization/current：返回当前用户有效菜单、操作键及手工配置的权限标识；仅需登录。 */
  @Get('current')
  async current(@Req() request: { user: { userId: string } }) {
    return Result.success(await this.authorization.current(request.user.userId))
  }
}
