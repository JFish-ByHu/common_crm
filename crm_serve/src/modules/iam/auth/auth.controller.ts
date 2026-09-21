import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthResultPresenter } from './auth-result.presenter'
import { CurrentUser } from './decorators'
import { ChangePasswordDto, LoginDto, LogoutDto, RefreshTokenDto } from './dto'
import { AccessTokenGuard } from './guards'
import type { AuthenticatedUser } from './types'

/** 认证 HTTP 接口。 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly presenter: AuthResultPresenter
  ) {}

  /**
   * 使用用户名和密码登录并创建刷新会话。
   *
   * @param loginDto 登录凭据
   * @returns access token 和 refresh token
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.presenter.present(() => this.authService.login(loginDto))
  }

  /**
   * 轮换当前 refresh token，并使旧 refresh token 失效。
   *
   * @param refreshTokenDto 当前 refresh token
   * @returns 新的 access token 和 refresh token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.presenter.present(() => this.authService.refresh(refreshTokenDto))
  }

  /**
   * 获取当前登录用户的基础资料。
   *
   * @param user access token guard 注入的当前用户
   * @returns 当前用户资料
   */
  @Get('me')
  @UseGuards(AccessTokenGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.presenter.present(() => this.authService.getCurrentUser(user))
  }

  /**
   * POST /api/auth/heartbeat：续期当前登录会话的 Redis 在线记录。
   * @param user 鉴权守卫提供的用户与会话，不接受客户端指定身份或时间
   * @returns recorded 表示是否成功登记；Redis 故障时为 false，登录状态不受影响
   */
  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  recordHeartbeat(@CurrentUser() user: AuthenticatedUser) {
    return this.presenter.present(() => this.authService.recordHeartbeat(user))
  }

  /**
   * 撤销 refresh token 对应的登录会话。
   *
   * @param logoutDto 待撤销的 refresh token
   * @returns 统一成功响应
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() logoutDto: LogoutDto) {
    return this.presenter.present(() => this.authService.logout(logoutDto))
  }

  /**
   * 修改当前用户密码，并撤销该用户的全部登录会话。
   *
   * @param user access token guard 注入的当前用户
   * @param changePasswordDto 当前密码和新密码
   * @returns 统一成功响应
   */
  @Patch('password')
  @UseGuards(AccessTokenGuard)
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    return this.presenter.present(() => this.authService.changePassword(user, changePasswordDto))
  }
}
