import {
  Body,
  Controller,
  Get,
  Query,
  Res,
  StreamableFile,
  HttpCode,
  Post,
  Req,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import type { Request, Response } from 'express'
import { Result } from '../../common'
import { UploadFileDto, PreviewFileDto } from './dto'
import { FilesService } from './services'
import { FileUploadInterceptor } from './file-upload.interceptor'

/** 文件上传遵循全局会话和接口权限校验，上传者仅取自已认证的会话。 */
@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  /**
   * GET /api/files/preview：鉴权读取头像，校验上传归属或用户列表访问权限。
   * @param query fileId，禁止客户端传磁盘路径
   * @returns 图片二进制；需携带 Bearer token，不提供公开静态目录
   */
  @Get('preview')
  async previewAvatar(
    @Query() query: PreviewFileDto,
    @Req() request: Request & { user: { userId: string } },
    @Res({ passthrough: true }) response: Response
  ) {
    const file = await this.files.previewAvatar(query.fileId, request.user.userId)
    response.setHeader('Cache-Control', 'private, no-store')
    response.setHeader('X-Content-Type-Options', 'nosniff')
    return new StreamableFile(file.content, { type: file.mimeType, disposition: 'inline' })
  }

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
