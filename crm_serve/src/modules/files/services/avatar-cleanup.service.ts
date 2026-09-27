import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { FilesRepository } from '../repositories'
import { LocalStorageService } from './local-storage.service'

/** 每小时回收一批超过 24 小时的未关联头像；认领后禁止再绑定，失败留待下轮重试。 */
@Injectable()
export class AvatarCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AvatarCleanupService.name)
  private timer?: ReturnType<typeof setInterval>
  private running = false

  constructor(
    private readonly files: FilesRepository,
    private readonly storage: LocalStorageService
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.cleanExpiredAvatars(), 3_600_000)
    this.timer.unref()
  }

  onModuleDestroy() {
    clearInterval(this.timer)
  }

  private async cleanExpiredAvatars() {
    if (this.running) return
    this.running = true
    let incomplete = false
    try {
      for (const file of await this.files.findExpiredAvatars()) {
        try {
          if (!(await this.files.claimExpiredAvatar(file.fileId))) continue
          await this.storage.removeFile(file.storageKey)
          await this.files.deleteExpiredAvatar(file.fileId)
        } catch {
          incomplete = true
        }
      }
    } catch {
      incomplete = true
    } finally {
      this.running = false
      if (incomplete)
        this.logger.warn('临时头像清理未完成，将在下次任务重试，请检查数据库和文件存储状态')
    }
  }
}
