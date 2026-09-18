import { AuthSession, type AuthSessionRepository, type UserRepository } from '../../domain'
import type { AuthTokenData, LoginCommand } from '../contracts'
import { AuthApplicationError } from '../errors'
import type { PasswordHasher, TokenProvider } from '../ports'

/** 使用账号密码创建认证会话。 */
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly tokenProvider: TokenProvider,
    private readonly passwordHasher: PasswordHasher
  ) {}

  /**
   * 校验登录凭据并创建新的认证会话。
   *
   * @param command 用户名和密码
   * @returns 新签发的 access token 与 refresh token
   * @throws AuthApplicationError 输入、凭据或账号状态无效
   */
  async execute(command: LoginCommand): Promise<AuthTokenData> {
    const username = command.username?.trim()
    if (!username || !command.password) {
      throw new AuthApplicationError('INVALID_INPUT')
    }

    const user = await this.userRepository.findByUsername(username)
    if (!user) throw new AuthApplicationError('INVALID_CREDENTIALS')
    if (!user.isActive()) throw new AuthApplicationError('ACCOUNT_UNAVAILABLE')

    const passwordMatches = await this.passwordHasher.matches(command.password, user.passwordHash)
    if (!passwordMatches) throw new AuthApplicationError('INVALID_CREDENTIALS')

    const tokens = await this.tokenProvider.issueTokenPair(user)
    await this.authSessionRepository.create(
      new AuthSession({
        sessionId: tokens.sessionId,
        userId: user.userId,
        tokenHash: tokens.tokenHash,
        expiresAt: tokens.expiresAt,
        revokedAt: null
      })
    )

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }
  }
}
