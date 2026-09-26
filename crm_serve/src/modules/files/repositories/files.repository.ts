import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../database'
import { currentTimestamp } from '../../../common'
import type { StoredUpload } from '../types'

@Injectable()
export class FilesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** 记录上传者与临时文件元信息，上传阶段不修改任何用户头像。 */
  createTemporaryFile(input: StoredUpload) {
    const now = currentTimestamp()
    return this.prisma.crmFile.create({
      data: { ...input, status: 'TEMPORARY', createTime: now, updateTime: now }
    })
  }
}
