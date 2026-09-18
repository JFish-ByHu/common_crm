import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, UseGuards } from '@nestjs/common'
import {
  ChangePasswordUseCase,
  GetCurrentUserUseCase,
  LoginUseCase,
  LogoutUseCase,
  RefreshTokenUseCase,
  type AuthenticatedUser
} from '../../../application'
import { CurrentUser } from '../decorators'
import { ChangePasswordDto, LoginDto, LogoutDto, RefreshTokenDto } from '../dto'
import { AccessTokenGuard } from '../guards'
import { AuthResultPresenter } from '../presenters'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
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
    return this.presenter.present(() => this.loginUseCase.execute(loginDto))
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
    return this.presenter.present(() => this.refreshTokenUseCase.execute(refreshTokenDto))
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
    return this.presenter.present(() => this.getCurrentUserUseCase.execute(user))
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
    return this.presenter.present(() => this.logoutUseCase.execute(logoutDto))
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
    return this.presenter.present(() =>
      this.changePasswordUseCase.execute(user, changePasswordDto)
    )
  }
}
