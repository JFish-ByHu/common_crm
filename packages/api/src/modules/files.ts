import type { UploadedFile, UploadFileOptions } from '@common-crm/types/api'
import { request } from '../core'
import type { ApiRequestConfig } from '../types'

export type { FileCategory, UploadedFile, UploadFileOptions } from '@common-crm/types/api'

/** 单文件上传：使用浏览器生成 multipart boundary，支持进度回调及取消请求。 */
export const uploadFile = (
  file: File,
  options: UploadFileOptions = {},
  config: Pick<ApiRequestConfig, 'signal' | 'onUploadProgress' | 'timeout' | 'showProgress'> = {}
) => {
  const data = new FormData()
  data.append('category', options.category ?? 'file')
  data.append('file', file)
  return request<UploadedFile, FormData>({
    timeout: 120_000,
    ...config,
    url: '/files/upload',
    method: 'post',
    data,
    headers: { 'Content-Type': undefined },
    retryOnUnavailable: false
  })
}
