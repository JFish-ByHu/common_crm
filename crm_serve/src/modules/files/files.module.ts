import { Module } from '@nestjs/common'
import { FilesController } from './files.controller'
import { FileUploadInterceptor } from './file-upload.interceptor'
import { FilesRepository } from './repositories'
import {
  FilesService,
  FileValidationService,
  LocalStorageService,
  AvatarCleanupService
} from './services'
import { AuthorizationModule } from '../authorization'

@Module({
  imports: [AuthorizationModule],
  controllers: [FilesController],
  providers: [
    FilesRepository,
    FilesService,
    FileValidationService,
    LocalStorageService,
    FileUploadInterceptor,
    AvatarCleanupService
  ],
  exports: [FilesRepository]
})
export class FilesModule {}
