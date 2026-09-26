import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import type { Request } from 'express'
import { Result } from '../../common'
import { UploadFileDto } from './dto'
import { FilesService } from './services'
import { FileUploadInterceptor } from './file-upload.interceptor'

/** 文件上传遵循全局会话和接口权限校验，上传者仅取自已认证的会话。 */
@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  /**
   * POST /api/files/upload：上传单个图片或文档，按分类和年月自动归档。
   * @param input multipart 文本字段 category：avatar、image、file，默认 file
   * @param file multipart 文件字段 file；实际内容和扩展名必须匹配
   * @returns 临时 fileId 与公开元信息，不返回磁盘路径，不直接绑定用户头像
   */
  @Post('upload')
  @HttpCode(200)
  @UseInterceptors(FileUploadInterceptor)
  async uploadFile(
    @Body() input: UploadFileDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() request: Request & { user: { userId: string } }
  ) {
    return Result.success(await this.files.uploadFile(file, input.category, request.user.userId))
  }
}
