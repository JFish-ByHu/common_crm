import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../database'
import type { AuthSessionRecord, RotateAuthSessionInput } from './types'

/** 登录会话的 Prisma 数据访问。 */
@Injectable()
export class AuthSessionRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * 持久化新认证会话。
   *
   * @param session 待创建的认证会话
   * @returns 创建完成后返回 void
   */
  async create(session: AuthSessionRecord): Promise<void> {
    await this.prismaService.crmAuthSession.create({
      data: {
        sessionId: session.sessionId,
        userId: session.userId,
        tokenHash: session.tokenHash,
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAt
      }
    })
  }

  /**
   * 查询指定用户仍有效的认证会话。
   *
   * @param sessionId 会话 ID
   * @param userId 用户 ID
   * @param at 判断有效期的时间
   * @returns 有效会话；不存在时返回 null
   */
  async findActive(sessionId: string, userId: string, at: Date): Promise<AuthSessionRecord | null> {
    const session = await this.prismaService.crmAuthSession.findFirst({
      where: {
        sessionId,
        userId,
        revokedAt: null,
        expiresAt: { gt: at }
      },
      select: {
        sessionId: true,
        userId: true,
        tokenHash: true,
        expiresAt: true,
        revokedAt: true
      }
    })
    return session
  }

  /**
   * 通过条件更新 refresh token，确保旧 token 只能成功轮换一次。
   *
   * @param input 当前会话条件与新 token 数据
   * @returns 恰好更新一个会话时返回 true
   */
  async rotate(input: RotateAuthSessionInput): Promise<boolean> {
    const result = await this.prismaService.crmAuthSession.updateMany({
      where: {
        sessionId: input.sessionId,
        userId: input.userId,
        tokenHash: input.previousTokenHash,
        revokedAt: null,
        expiresAt: { gt: input.rotatedAt }
      },
      data: {
        tokenHash: input.nextTokenHash,
        expiresAt: input.nextExpiresAt
      }
    })
    return result.count === 1
  }

  /**
   * 按 refresh token 摘要幂等撤销会话。
   *
   * @param tokenHash refresh token 摘要
   * @param revokedAt 撤销时间
   * @returns 撤销完成后返回 void
   */
  async revokeByTokenHash(tokenHash: string, revokedAt: Date): Promise<void> {
    await this.prismaService.crmAuthSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt }
    })
  }
}
