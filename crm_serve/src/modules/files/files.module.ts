import { Module } from '@nestjs/common'
import { FilesController } from './files.controller'
import { FileUploadInterceptor } from './file-upload.interceptor'
import { FilesRepository } from './repositories'
import { FilesService, FileValidationService, LocalStorageService } from './services'

@Module({
  controllers: [FilesController],
  providers: [
    FilesRepository,
    FilesService,
    FileValidationService,
    LocalStorageService,
    FileUploadInterceptor
  ]
})
export class FilesModule {}
