import { Injectable } from '@nestjs/common'
import { currentTimestamp, dateToTimestamp, timestampToDate } from '../../../common'
import { PrismaService } from '../../../database'
import type { AuthSessionRecord, RotateAuthSessionInput } from '../types'

/** 登录会话的 Prisma 数据访问。 */
@Injectable()
export class AuthSessionRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /** 批量查询仍可用于在线判定的会话，不读取 token 摘要。 */
  findActiveForUsers(userIds: string[]) {
    return this.prismaService.readWithRetry(() =>
      this.prismaService.crmAuthSession.findMany({
        where: {
          userId: { in: userIds },
          revokedAt: null,
          expiresAt: { gt: currentTimestamp() },
          user: { accountStatus: 1 }
        },
        select: { sessionId: true, userId: true }
      })
    )
  }

  /** 在撤销或删除前收集在线 Key；TTL 会兜底清理并发产生的残余记录。 */
  async findSessionIdsByUsers(userIds: string[]): Promise<string[]> {
    const sessions = await this.prismaService.readWithRetry(() =>
      this.prismaService.crmAuthSession.findMany({
        where: { userId: { in: userIds }, revokedAt: null, expiresAt: { gt: currentTimestamp() } },
        select: { sessionId: true }
      })
    )
    return sessions.map(session => session.sessionId)
  }

  /** 撤销指定用户的全部有效会话，并返回待清理的在线记录 ID。 */
  async revokeByUsers(userIds: string[], revokedAt: Date): Promise<string[]> {
    const uniqueUserIds = [...new Set(userIds)]
    if (!uniqueUserIds.length) return []
    const timestamp = dateToTimestamp(revokedAt)
    return this.prismaService.$transaction(async transaction => {
      const sessions = await transaction.crmAuthSession.findMany({
        where: {
          userId: { in: uniqueUserIds },
          revokedAt: null,
          expiresAt: { gt: timestamp }
        },
        select: { sessionId: true }
      })
      if (!sessions.length) return []
      await transaction.crmAuthSession.updateMany({
        where: {
          userId: { in: uniqueUserIds },
          revokedAt: null,
          expiresAt: { gt: timestamp }
        },
        data: { revokedAt: timestamp, updateTime: timestamp }
      })
      return sessions.map(session => session.sessionId)
    })
  }

  /**
   * 持久化新认证会话。
   *
   * @param session 待创建的认证会话
   * @returns 创建完成后返回 void
   */
  async create(session: AuthSessionRecord): Promise<void> {
    const now = currentTimestamp()
    await this.prismaService.crmAuthSession.create({
      data: {
        sessionId: session.sessionId,
        userId: session.userId,
        tokenHash: session.tokenHash,
        expiresAt: dateToTimestamp(session.expiresAt),
        revokedAt: session.revokedAt ? dateToTimestamp(session.revokedAt) : null,
        createTime: now,
        updateTime: now
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
    const session = await this.prismaService.readWithRetry(() =>
      this.prismaService.crmAuthSession.findFirst({
        where: {
          sessionId,
          userId,
          revokedAt: null,
          expiresAt: { gt: dateToTimestamp(at) }
        },
        select: {
          sessionId: true,
          userId: true,
          tokenHash: true,
          expiresAt: true,
          revokedAt: true
        }
      })
    )
    return session
      ? {
          ...session,
          expiresAt: timestampToDate(session.expiresAt),
          revokedAt: session.revokedAt === null ? null : timestampToDate(session.revokedAt)
        }
      : null
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
        expiresAt: { gt: dateToTimestamp(input.rotatedAt) }
      },
      data: {
        tokenHash: input.nextTokenHash,
        expiresAt: dateToTimestamp(input.nextExpiresAt),
        updateTime: dateToTimestamp(input.rotatedAt)
      }
    })
    return result.count === 1
  }

  /**
   * 按 refresh token 摘要幂等撤销会话。
   *
   * @param tokenHash refresh token 摘要
   * @param revokedAt 撤销时间
   * @returns 本次撤销的会话 ID；未匹配时返回 null
   */
  async revokeByTokenHash(tokenHash: string, revokedAt: Date): Promise<string | null> {
    const timestamp = dateToTimestamp(revokedAt)
    return this.prismaService.$transaction(async transaction => {
      const session = await transaction.crmAuthSession.findUnique({
        where: { tokenHash },
        select: { sessionId: true }
      })
      if (!session) return null
      const result = await transaction.crmAuthSession.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: timestamp, updateTime: timestamp }
      })
      return result.count ? session.sessionId : null
    })
  }
}
