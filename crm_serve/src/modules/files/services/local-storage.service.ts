import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { mkdir, mkdtemp, rename, rm } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'

@Injectable()
export class LocalStorageService {
  private readonly logger = new Logger(LocalStorageService.name)
  private readonly root: string

  constructor(config: ConfigService) {
    this.root = config.getOrThrow<string>('storage.uploadDirectory')
  }

  async createStagingDirectory(): Promise<string> {
    const directory = this.resolveStoragePath('.tmp')
    await mkdir(directory, { recursive: true })
    return mkdtemp(resolve(directory, 'upload-'))
  }

  async storeFile(temporaryFile: string, storageKey: string): Promise<void> {
    const destination = this.resolveStoragePath(storageKey)
    await mkdir(dirname(destination), { recursive: true })
    await rename(temporaryFile, destination)
  }

  async removeFile(storageKey: string): Promise<void> {
    await rm(this.resolveStoragePath(storageKey), { force: true })
  }

  /** 仅清理本次请求创建的暂存目录，不覆盖原请求的错误或成功结果。 */
  async removeStagingDirectory(directory: string): Promise<void> {
    const stagingRoot = this.resolveStoragePath('.tmp')
    if (dirname(directory) !== stagingRoot) throw new Error('Invalid staging directory')
    try {
      await rm(directory, { recursive: true, force: true })
    } catch {
      this.logger.error('上传暂存目录清理失败，请检查存储目录权限和磁盘状态')
    }
  }

  private resolveStoragePath(key: string): string {
    const destination = resolve(this.root, key)
    const path = relative(this.root, destination)
    if (!path || path === '..' || path.startsWith('..' + sep) || isAbsolute(path)) {
      throw new Error('Invalid storage key')
    }
    return destination
  }
}
