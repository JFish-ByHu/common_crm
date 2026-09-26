import { FileErrors } from '@common-crm/errors'
import { Injectable } from '@nestjs/common'
import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import type { Request, Response } from 'express'
import multer from 'multer'
import { defer, lastValueFrom } from 'rxjs'
import { LocalStorageService } from './services'
import { MAX_UPLOAD_BYTES } from './types'
import { rejectFileUpload } from './files.error'

/** 流式暂存文件；DTO 校验、内容校验、落库失败时均回收本次请求暂存目录。 */
@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  private activeUploads = 0

  constructor(private readonly storage: LocalStorageService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    return defer(async () => {
      if (this.activeUploads >= 4) return rejectFileUpload(FileErrors.UPLOAD_BUSY)
      this.activeUploads++
      let directory: string | undefined
      try {
        directory = await this.storage.createStagingDirectory()
        const parseUpload = multer({
          defParamCharset: 'utf8',
          storage: multer.diskStorage({ destination: directory }),
          limits: {
            fileSize: MAX_UPLOAD_BYTES,
            files: 1,
            fields: 1,
            parts: 2,
            fieldSize: 128,
            fieldNameSize: 64
          }
        }).single('file')
        const request = context.switchToHttp().getRequest<Request>()
        const response = context.switchToHttp().getResponse<Response>()
        if (!request.is('multipart/form-data')) rejectFileUpload(FileErrors.MULTIPART_REQUIRED)
        await new Promise<void>((resolve, reject) => {
          parseUpload(request, response, error => (error ? reject(error) : resolve()))
        }).catch((error: unknown) => {
          if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
              rejectFileUpload(FileErrors.FILE_TOO_LARGE, {
                maxSizeMB: MAX_UPLOAD_BYTES / 1024 / 1024
              })
            }
            rejectFileUpload(FileErrors.INVALID_MULTIPART_FIELDS)
          }
          // 磁盘故障交给全局过滤器记录诊断；无效 multipart 不暴露底层报错。
          if (error instanceof Error && 'code' in error) throw error
          rejectFileUpload(FileErrors.UPLOAD_INTERRUPTED)
        })
        return await lastValueFrom(next.handle())
      } finally {
        try {
          if (directory) await this.storage.removeStagingDirectory(directory)
        } finally {
          this.activeUploads--
        }
      }
    })
  }
}
