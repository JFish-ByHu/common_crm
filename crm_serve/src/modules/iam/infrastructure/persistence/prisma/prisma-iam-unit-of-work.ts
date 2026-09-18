import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../../shared/infrastructure/database'
import type { IamUnitOfWork } from '../../../application'

@Injectable()
export class PrismaIamUnitOfWork implements IamUnitOfWork {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * 在同一事务中更新密码并撤销用户的全部有效会话。
   *
   * @param userId 用户 ID
   * @param passwordHash 新密码摘要
   * @param changedAt 密码修改和会话撤销时间
   * @returns 事务提交后返回 void
   */
  async changePasswordAndRevokeSessions(
    userId: string,
    passwordHash: string,
    changedAt: Date
  ): Promise<void> {
    await this.prismaService.$transaction([
      this.prismaService.crmUser.update({
        where: { userId },
        data: { password: passwordHash, updateTime: changedAt }
      }),
      this.prismaService.crmAuthSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: changedAt }
      })
    ])
  }
}
