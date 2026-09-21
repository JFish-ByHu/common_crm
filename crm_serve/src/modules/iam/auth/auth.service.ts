import { Injectable } from '@nestjs/common'
import { compare, hash } from 'bcryptjs'
import { AuthApplicationError } from './auth.error'
import { AuthSessionRepository } from './auth-session.repository'
import { AuthTokenService } from './auth-token.service'
import type {
  AuthenticatedUser,
  AuthTokenData,
  AuthUserProfile,
  ChangePasswordCommand,
  LoginCommand,
  LogoutCommand,
  RefreshTokenCommand,
  UserRecord
} from './types'
import { UserRepository } from './user.repository'
import { PresenceService } from '../presence'

/** 认证业务服务，负责登录、会话轮换、鉴权和密码修改。 */
@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly authTokenService: AuthTokenService,
    private readonly presenceService: PresenceService
  ) {}

  /**
   * 校验登录凭据并创建新的认证会话。
   *
   * @param command 用户名和密码
   * @returns 新签发的 access token 与 refresh token
   * @throws AuthApplicationError 输入、凭据或账号状态无效
   */
  async login(command: LoginCommand): Promise<AuthTokenData> {
    const username = command.username?.trim()
    if (!username || !command.password) throw new AuthApplicationError('INVALID_INPUT')

    const user = await this.userRepository.findByUsername(username)
    if (!user) throw new AuthApplicationError('INVALID_CREDENTIALS')
    this.ensureActive(user)
    if (!(await compare(command.password, user.passwordHash))) {
      throw new AuthApplicationError('INVALID_CREDENTIALS')
    }

    const tokens = await this.authTokenService.issueTokenPair(user)
    await this.authSessionRepository.create({
      sessionId: tokens.sessionId,
      userId: user.userId,
      tokenHash: tokens.tokenHash,
      expiresAt: tokens.expiresAt,
      revokedAt: null
    })
    await this.presenceService.recordSession(tokens.sessionId)

    return this.toTokenData(tokens)
  }

  /**
   * 轮换 refresh token，并使旧 token 立即失效。
   *
   * @param command 当前 refresh token
   * @returns 新签发的 access token 与 refresh token
   * @throws AuthApplicationError token、会话或账号状态无效
   */
  async refresh(command: RefreshTokenCommand): Promise<AuthTokenData> {
    if (!command.refreshToken) throw new AuthApplicationError('INVALID_REFRESH_TOKEN')
    const payload = await this.authTokenService.verifyRefreshToken(command.refreshToken)
    if (!payload) throw new AuthApplicationError('INVALID_REFRESH_TOKEN')

    const now = new Date()
    const previousTokenHash = this.authTokenService.hashToken(command.refreshToken)
    const session = await this.authSessionRepository.findActive(payload.sid, payload.sub, now)
    if (!session || session.tokenHash !== previousTokenHash) {
      throw new AuthApplicationError('INVALID_REFRESH_TOKEN')
    }

    const user = await this.userRepository.findById(payload.sub)
    if (!user) throw new AuthApplicationError('ACCOUNT_UNAVAILABLE')
    this.ensureActive(user)

    const tokens = await this.authTokenService.issueTokenPair(user, payload.sid)
    const rotated = await this.authSessionRepository.rotate({
      sessionId: payload.sid,
      userId: payload.sub,
      previousTokenHash,
      nextTokenHash: tokens.tokenHash,
      nextExpiresAt: tokens.expiresAt,
      rotatedAt: now
    })
    if (!rotated) throw new AuthApplicationError('INVALID_REFRESH_TOKEN')

    return this.toTokenData(tokens)
  }

  /**
   * 移除仅供鉴权使用的会话字段。
   *
   * @param user 当前登录用户
   * @returns 可返回给客户端的用户资料
   */
  getCurrentUser(user: AuthenticatedUser): AuthUserProfile {
    return { userId: user.userId, username: user.username, email: user.email }
  }

  /** 心跳只更新 Redis，不修改数据库资料时间或延长认证有效期。 */
  async recordHeartbeat(user: AuthenticatedUser): Promise<{ recorded: boolean }> {
    return { recorded: await this.presenceService.recordSession(user.sessionId) }
  }

  /**
   * 幂等撤销 refresh token 对应的认证会话。
   *
   * @param command 待撤销的 refresh token
   * @returns 操作完成后返回 void
   */
  async logout(command: LogoutCommand): Promise<void> {
    const sessionId = await this.authSessionRepository.revokeByTokenHash(
      this.authTokenService.hashToken(command.refreshToken),
      new Date()
    )
    if (sessionId) await this.presenceService.removeSessions([sessionId])
  }

  /**
   * 校验当前密码并原子更新密码、撤销全部会话。
   *
   * @param user 当前登录用户
   * @param command 当前密码和新密码
   * @returns 操作完成后返回 void
   * @throws AuthApplicationError 密码未变化、凭据错误或账号不可用
   */
  async changePassword(user: AuthenticatedUser, command: ChangePasswordCommand): Promise<void> {
    if (command.currentPassword === command.newPassword) {
      throw new AuthApplicationError('PASSWORD_UNCHANGED')
    }

    const storedUser = await this.userRepository.findById(user.userId)
    if (!storedUser) throw new AuthApplicationError('ACCOUNT_UNAVAILABLE')
    this.ensureActive(storedUser)
    if (!(await compare(command.currentPassword, storedUser.passwordHash))) {
      throw new AuthApplicationError('INVALID_CREDENTIALS')
    }

    const sessionIds = await this.authSessionRepository.findSessionIdsByUsers([user.userId])
    await this.userRepository.updatePasswordAndRevokeSessions(
      user.userId,
      await hash(command.newPassword, 12),
      new Date()
    )
    await this.presenceService.removeSessions(sessionIds)
  }

  /**
   * 校验 access token、会话和账号状态。
   *
   * @param accessToken 待校验的 access token
   * @returns 校验成功后的当前用户；无效时返回 null
   */
  async validateAccessSession(accessToken: string): Promise<AuthenticatedUser | null> {
    const payload = await this.authTokenService.verifyAccessToken(accessToken)
    if (!payload) return null

    const session = await this.authSessionRepository.findActive(
      payload.sid,
      payload.sub,
      new Date()
    )
    if (!session) return null

    const user = await this.userRepository.findById(payload.sub)
    if (!user || user.accountStatus !== 1) return null

    return {
      userId: user.userId,
      username: user.username,
      email: user.email,
      sessionId: session.sessionId
    }
  }

  private ensureActive(user: UserRecord): void {
    if (user.accountStatus !== 1) throw new AuthApplicationError('ACCOUNT_UNAVAILABLE')
  }

  private toTokenData(tokens: AuthTokenData): AuthTokenData {
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }
  }
}
