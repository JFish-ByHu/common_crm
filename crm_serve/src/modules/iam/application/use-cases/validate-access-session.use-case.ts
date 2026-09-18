import type { AuthSessionRepository, UserRepository } from '../../domain'
import type { AuthenticatedUser } from '../contracts'
import type { TokenProvider } from '../ports'

/** 校验 access token 及其关联会话。 */
export class ValidateAccessSessionUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly tokenProvider: TokenProvider
  ) {}

  /**
   * 校验 access token、会话和账号状态。
   *
   * @param accessToken 待校验的 access token
   * @returns 校验成功后的当前用户；无效时返回 null
   */
  async execute(accessToken: string): Promise<AuthenticatedUser | null> {
    const payload = await this.tokenProvider.verifyAccessToken(accessToken)
    if (!payload) return null

    const session = await this.authSessionRepository.findActive(
      payload.sid,
      payload.sub,
      new Date()
    )
    if (!session) return null

    const user = await this.userRepository.findById(payload.sub)
    if (!user || !user.isActive()) return null

    return {
      userId: user.userId,
      username: user.username,
      email: user.email,
      sessionId: session.sessionId
    }
  }
}
