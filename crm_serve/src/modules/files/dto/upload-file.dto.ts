import { IsIn } from 'class-validator'
import type { FileCategory, UploadFileOptions } from '@common-crm/types/api'

export class UploadFileDto implements UploadFileOptions {
  @IsIn(['avatar', 'image', 'file'])
  category: FileCategory = 'file'
}
