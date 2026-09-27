import { Injectable } from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import { FileErrors } from '@common-crm/errors'
import { PrismaService } from '../../../database'
import { BusinessError, currentTimestamp } from '../../../common'
import { AVATAR_TEMPORARY_TTL_MS, type StoredUpload } from '../types'

@Injectable()
export class FilesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAvatar(fileId: string) {
    return this.prisma.crmFile.findUnique({
      where: { fileId },
      include: { avatarUser: { select: { userId: true } } }
    })
  }

  /** 在用户保存事务中认领临时头像；并发绑定仅允许一个请求成功。 */
  async attachAvatar(transaction: Prisma.TransactionClient, fileId: string, actorId?: string) {
    if (!actorId) throw new BusinessError(FileErrors.AVATAR_UNAVAILABLE)
    const result = await transaction.crmFile.updateMany({
      where: {
        fileId,
        uploadedBy: actorId,
        category: 'avatar',
        status: 'TEMPORARY',
        updateTime: { gt: BigInt(Date.now() - AVATAR_TEMPORARY_TTL_MS) },
        avatarUser: { is: null }
      },
      data: { status: 'ATTACHED', updateTime: currentTimestamp() }
    })
    if (result.count !== 1) throw new BusinessError(FileErrors.AVATAR_UNAVAILABLE)
  }

  /** 解除业务关联后重新计时，保留 24 小时供清理，不在用户事务中删除磁盘文件。 */
  async releaseAvatar(transaction: Prisma.TransactionClient, fileId: string | null) {
    if (!fileId) return
    await transaction.crmFile.updateMany({
      where: { fileId, category: 'avatar', status: 'ATTACHED', avatarUser: { is: null } },
      data: { status: 'TEMPORARY', updateTime: currentTimestamp() }
    })
  }

  findExpiredAvatars() {
    return this.prisma.crmFile.findMany({
      where: {
        category: 'avatar',
        avatarUser: { is: null },
        OR: [
          {
            status: 'TEMPORARY',
            updateTime: { lte: BigInt(Date.now() - AVATAR_TEMPORARY_TTL_MS) }
          },
          { status: 'DELETING' }
        ]
      },
      orderBy: { updateTime: 'asc' },
      take: 100
    })
  }

  async claimExpiredAvatar(fileId: string) {
    const result = await this.prisma.crmFile.updateMany({
      where: {
        fileId,
        category: 'avatar',
        avatarUser: { is: null },
        OR: [
          {
            status: 'TEMPORARY',
            updateTime: { lte: BigInt(Date.now() - AVATAR_TEMPORARY_TTL_MS) }
          },
          { status: 'DELETING' }
        ]
      },
      data: { status: 'DELETING' }
    })
    return result.count === 1
  }

  deleteExpiredAvatar(fileId: string) {
    return this.prisma.crmFile.deleteMany({
      where: { fileId, status: 'DELETING', avatarUser: { is: null } }
    })
  }

  /** 记录上传者与临时文件元信息，上传阶段不修改任何用户头像。 */
  createTemporaryFile(input: StoredUpload) {
    const now = currentTimestamp()
    return this.prisma.crmFile.create({
      data: { ...input, status: 'TEMPORARY', createTime: now, updateTime: now }
    })
  }
}
