import type { AuthSessionRepository, UserRepository } from '../../domain'
import type { AuthTokenData, RefreshTokenCommand } from '../contracts'
import { AuthApplicationError } from '../errors'
import type { TokenProvider } from '../ports'

/** 校验并轮换 refresh token。 */
export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly tokenProvider: TokenProvider
  ) {}

  /**
   * 轮换 refresh token，并使旧 token 立即失效。
   *
   * @param command 当前 refresh token
   * @returns 新签发的 access token 与 refresh token
   * @throws AuthApplicationError token、会话或账号状态无效
   */
  async execute(command: RefreshTokenCommand): Promise<AuthTokenData> {
    const payload = await this.tokenProvider.verifyRefreshToken(command.refreshToken)
    if (!payload) throw new AuthApplicationError('INVALID_REFRESH_TOKEN')

    const now = new Date()
    const previousTokenHash = this.tokenProvider.hashToken(command.refreshToken)
    const session = await this.authSessionRepository.findActive(payload.sid, payload.sub, now)
    if (!session || !session.matchesTokenHash(previousTokenHash)) {
      throw new AuthApplicationError('INVALID_REFRESH_TOKEN')
    }

    const user = await this.userRepository.findById(payload.sub)
    if (!user || !user.isActive()) {
      throw new AuthApplicationError('ACCOUNT_UNAVAILABLE')
    }

    const tokens = await this.tokenProvider.issueTokenPair(user, payload.sid)
    const rotated = await this.authSessionRepository.rotate({
      sessionId: payload.sid,
      userId: payload.sub,
      previousTokenHash,
      nextTokenHash: tokens.tokenHash,
      nextExpiresAt: tokens.expiresAt,
      rotatedAt: now
    })
    if (!rotated) throw new AuthApplicationError('INVALID_REFRESH_TOKEN')

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }
  }
}
