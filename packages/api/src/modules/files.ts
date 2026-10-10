import type { UploadedFile, UploadFileOptions } from '@common-crm/types/api'
import { ApiError, request, requestRaw } from '../core'
import type { ApiRequestConfig, ApiResponse } from '../types'

export type { FileCategory, UploadedFile, UploadFileOptions } from '@common-crm/types/api'

/** 只读取服务端提供的头像预览路径，避免把 Bearer token 发往任意地址。 */
export const loadAvatar = async (url: string, signal: AbortSignal): Promise<Blob> => {
  if (!/^\/files\/preview\?fileId=crm_file_[0-9a-f-]+$/i.test(url))
    throw new Error('Invalid avatar preview URL')
  const response = await requestRaw<Blob>({
    url,
    method: 'get',
    responseType: 'blob',
    signal,
    showProgress: false,
    retryOnUnavailable: false
  })
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(response.data.type))
    throw new ApiError('头像响应格式无效', -1, response.status, undefined, { kind: 'protocol' })
  return response.data
}

/** 单文件上传：使用浏览器生成 multipart boundary，支持进度回调及取消请求。 */
export const uploadFile = (
  file: File,
  options: UploadFileOptions = {},
  config: Pick<ApiRequestConfig, 'signal' | 'onUploadProgress' | 'timeout' | 'showProgress'> = {}
): Promise<ApiResponse<UploadedFile>> => {
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
