/** 服务端白名单分类，不接受自定义磁盘路径。 */
export type FileCategory = 'avatar' | 'image' | 'file'

export interface UploadFileOptions {
  /** 默认 file；头像、图片需显式指定分类。 */
  category?: FileCategory
}

/** 上传仅生成临时文件，后续业务保存时再关联 fileId。 */
export interface UploadedFile {
  fileId: string
  category: FileCategory
  originalName: string
  mimeType: string
  extension: string
  size: number
  status: 'TEMPORARY'
  createTime: string
}
