import { defineError } from './types.js'

export const FileErrors = Object.freeze({
  INVALID_CATEGORY: defineError(150001, 422, '不支持的文件分类'),
  FILE_TOO_LARGE: defineError(
    150002,
    413,
    /** @param {{ maxSizeMB: number }} params */ params => `文件不能超过 ${params.maxSizeMB} MB`
  ),
  UNSUPPORTED_EXTENSION: defineError(
    150003,
    415,
    /** @param {{ extensions: string[] }} params */ params =>
      `该分类仅支持 ${params.extensions.join('、')} 格式`
  ),
  EMPTY_FILE: defineError(150004, 422, '不能上传空文件'),
  UNRECOGNIZED_CONTENT: defineError(150005, 415, '无法识别文件内容，文件可能已损坏'),
  NOT_TEXT: defineError(150006, 415, '文件内容与文本格式不一致'),
  INVALID_TEXT_CONTROL: defineError(150007, 415, '文本文件包含不支持的控制字符'),
  INVALID_TEXT_ENCODING: defineError(150008, 415, '仅支持 UTF-8 编码的纯文本或 CSV 文件'),
  TYPE_MISMATCH: defineError(150009, 415, '文件实际类型与扩展名不一致或格式不受支持'),
  INVALID_FILENAME: defineError(150010, 422, '文件名为空、过长或包含不允许的字符'),
  FILE_REQUIRED: defineError(150011, 422, '请选择要上传的文件'),
  UPLOAD_BUSY: defineError(150012, 429, '上传任务较多，请稍后重试'),
  MULTIPART_REQUIRED: defineError(150013, 415, '请使用 multipart/form-data 上传'),
  INVALID_MULTIPART_FIELDS: defineError(
    150014,
    422,
    '仅支持单个 file 文件和可选的 category 分类字段'
  ),
  UPLOAD_INTERRUPTED: defineError(150015, 400, '文件上传中断或请求格式不正确')
})
