import { Injectable } from '@nestjs/common'
import { dateToTimestamp } from '../../../common'
import { PrismaService } from '../../../database'
import type { UserRecord } from '../types'

/** 用户账号的 Prisma 数据访问。 */
@Injectable()
export class AuthUserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * 按用户 ID 查询账号。
   *
   * @param userId 用户 ID
   * @returns 用户认证字段；不存在时返回 null
   */
  async findById(userId: string): Promise<UserRecord | null> {
    const user = await this.prismaService.readWithRetry(() =>
      this.prismaService.crmUser.findUnique({
        where: { userId },
        select: {
          userId: true,
          username: true,
          password: true,
          email: true,
          accountStatus: true
        }
      })
    )
    return user
      ? {
          userId: user.userId,
          username: user.username,
          passwordHash: user.password,
          email: user.email,
          accountStatus: user.accountStatus
        }
      : null
  }

  /**
   * 按用户名查询账号。
   *
   * @param username 登录用户名
   * @returns 用户认证字段；不存在时返回 null
   */
  async findByUsername(username: string): Promise<UserRecord | null> {
    const user = await this.prismaService.readWithRetry(() =>
      this.prismaService.crmUser.findUnique({
        where: { username },
        select: {
          userId: true,
          username: true,
          password: true,
          email: true,
          accountStatus: true
        }
      })
    )
    return user
      ? {
          userId: user.userId,
          username: user.username,
          passwordHash: user.password,
          email: user.email,
          accountStatus: user.accountStatus
        }
      : null
  }

  /**
   * 在同一事务中更新密码并撤销用户的全部有效会话。
   *
   * @param userId 用户 ID
   * @param passwordHash 新密码摘要
   * @param changedAt 密码修改和会话撤销时间
   * @returns 事务提交后返回 void
   */
  async updatePasswordAndRevokeSessions(
    userId: string,
    passwordHash: string,
    changedAt: Date
  ): Promise<void> {
    const timestamp = dateToTimestamp(changedAt)
    await this.prismaService.$transaction([
      this.prismaService.crmUser.update({
        where: { userId },
        data: { password: passwordHash, updateTime: timestamp }
      }),
      this.prismaService.crmAuthSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: timestamp, updateTime: timestamp }
      })
    ])
  }
}
