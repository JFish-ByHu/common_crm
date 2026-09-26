import { FileErrors } from '@common-crm/errors'
import { Injectable, Logger } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { FileCategory, UploadedFile } from '@common-crm/types/api'
import { currentTimestamp, formatApiDateTime } from '../../../common'
import { FilesRepository } from '../repositories'
import { rejectFileUpload } from '../files.error'
import { FileValidationService } from './file-validation.service'
import { LocalStorageService } from './local-storage.service'

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name)

  constructor(
    private readonly repository: FilesRepository,
    private readonly storage: LocalStorageService,
    private readonly validation: FileValidationService
  ) {}

  async uploadFile(
    file: Express.Multer.File | undefined,
    category: FileCategory,
    uploadedBy: string
  ): Promise<UploadedFile> {
    if (!file) return rejectFileUpload(FileErrors.FILE_REQUIRED)
    const metadata = await this.validation.validateFile(file, category)
    const fileId = `crm_file_${randomUUID()}`
    const month = formatApiDateTime(currentTimestamp()).slice(0, 7).replace('-', '/')
    const storageKey = `${category}/${month}/${fileId}.${metadata.extension}`
    await this.storage.storeFile(file.path, storageKey)
    try {
      const record = await this.repository.createTemporaryFile({
        ...metadata,
        fileId,
        category,
        storageKey,
        size: file.size,
        uploadedBy
      })
      return {
        fileId,
        category,
        ...metadata,
        size: file.size,
        status: 'TEMPORARY',
        createTime: formatApiDateTime(record.createTime)
      }
    } catch (error) {
      try {
        await this.storage.removeFile(storageKey)
      } catch {
        this.logger.error(`文件记录保存失败且文件清理失败：${fileId}`)
      }
      throw error
    }
  }
}
