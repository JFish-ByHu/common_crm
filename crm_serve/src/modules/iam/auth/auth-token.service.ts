import { createHash, randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import type { AuthTokenPayload, IssuedTokenPair, TokenSubject, TokenType } from './types'

/** JWT 签发、校验和 refresh token 摘要服务。 */
@Injectable()
export class AuthTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  /**
   * 为用户签发绑定同一会话的 access token 与 refresh token。
   *
   * @param subject token 中记录的用户信息
   * @param sessionId 已存在的会话 ID；省略时创建新会话 ID
   * @returns token 对及服务端持久化所需元数据
   */
  async issueTokenPair(
    subject: TokenSubject,
    sessionId: string = randomUUID()
  ): Promise<IssuedTokenPair> {
    const basePayload = {
      sub: subject.userId,
      username: subject.username,
      sid: sessionId
    }
    const refreshExpiresIn = this.getRefreshExpiresIn()
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...basePayload, type: 'access' as const },
        { jwtid: randomUUID() }
      ),
      this.jwtService.signAsync(
        { ...basePayload, type: 'refresh' as const },
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
          expiresIn: refreshExpiresIn,
          jwtid: randomUUID()
        }
      )
    ])

    return {
      sessionId,
      accessToken,
      refreshToken,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + refreshExpiresIn * 1000)
    }
  }

  /**
   * 校验 access token 的签名和用途。
   *
   * @param token 待校验的 token
   * @returns 合法载荷；校验失败时返回 null
   */
  verifyAccessToken(token: string): Promise<AuthTokenPayload | null> {
    return this.verifyToken(token, 'access', this.configService.getOrThrow<string>('JWT_SECRET'))
  }

  /**
   * 校验 refresh token 的签名和用途。
   *
   * @param token 待校验的 token
   * @returns 合法载荷；校验失败时返回 null
   */
  verifyRefreshToken(token: string): Promise<AuthTokenPayload | null> {
    return this.verifyToken(
      token,
      'refresh',
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET')
    )
  }

  /**
   * 计算 token 的 SHA-256 摘要。
   *
   * @param token 原始 token
   * @returns 十六进制 token 摘要
   */
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  private async verifyToken(
    token: string,
    expectedType: TokenType,
    secret: string
  ): Promise<AuthTokenPayload | null> {
    try {
      const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(token, { secret })
      if (
        payload.type !== expectedType ||
        typeof payload.sub !== 'string' ||
        typeof payload.username !== 'string' ||
        typeof payload.sid !== 'string'
      ) {
        return null
      }
      return payload
    } catch {
      return null
    }
  }

  private getRefreshExpiresIn(): number {
    const seconds = Number(this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN_SECONDS'))
    if (!Number.isFinite(seconds) || seconds <= 0) {
      throw new Error('JWT_REFRESH_EXPIRES_IN_SECONDS must be a positive number')
    }
    return seconds
  }
}
