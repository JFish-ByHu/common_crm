import type { AuthSessionRepository } from '../../domain'
import type { LogoutCommand } from '../contracts'
import type { TokenProvider } from '../ports'

/** 撤销 refresh token 对应的认证会话。 */
export class LogoutUseCase {
  constructor(
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly tokenProvider: TokenProvider
  ) {}

  /**
   * 幂等撤销 refresh token 对应的会话。
   *
   * @param command 待撤销的 refresh token
   * @returns 操作完成后返回 void
   */
  async execute(command: LogoutCommand): Promise<void> {
    const tokenHash = this.tokenProvider.hashToken(command.refreshToken)
    await this.authSessionRepository.revokeByTokenHash(tokenHash, new Date())
  }
}
