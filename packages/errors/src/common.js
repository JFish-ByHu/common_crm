import { defineError } from './types.js'

export const CommonErrors = Object.freeze({
  BAD_REQUEST: defineError(100001, 400, '请求参数无效'),
  VALIDATION_FAILED: defineError(100002, 422, '提交的参数不符合要求，请检查后重试'),
  INTERNAL_ERROR: defineError(100003, 500, '服务器内部错误，请稍后重试'),
  DATABASE_UNAVAILABLE: defineError(100004, 503, '数据库暂时不可用，请稍后重试'),
  SERVICE_UNAVAILABLE: defineError(100005, 503, '服务暂时不可用，请稍后重试'),
  NOT_FOUND: defineError(100006, 404, '请求的资源不存在'),
  CONFLICT: defineError(100007, 409, '数据存在冲突，请刷新后重试'),
  RATE_LIMITED: defineError(100008, 429, '请求过于频繁，请稍后重试'),
  METHOD_NOT_ALLOWED: defineError(100009, 405, '不支持该请求方法'),
  PAYLOAD_TOO_LARGE: defineError(100010, 413, '请求内容过大'),
  UNSUPPORTED_MEDIA_TYPE: defineError(100011, 415, '不支持该内容类型'),
  BAD_GATEWAY: defineError(100012, 502, '上游服务暂时不可用'),
  REQUEST_TIMEOUT: defineError(100013, 408, '请求超时，请稍后重试')
})
