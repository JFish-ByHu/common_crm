import { AuthErrors, isPermissionError, isUnauthorizedError } from '@common-crm/errors'
import { Notification } from './notification'

/** 请求异常只在业务捕获处展示一次；接口层负责将内部异常转换为可公开的业务文案。 */
export const notifyRequestError = (
  error: unknown,
  options: { title?: string; message?: string } = {}
) => {
  const failure =
    error && typeof error === 'object'
      ? (error as {
          code?: unknown
          status?: unknown
          message?: unknown
          name?: unknown
          notificationHandled?: unknown
        })
      : undefined
  if (
    failure?.notificationHandled === true ||
    failure?.name === 'CanceledError' ||
    failure?.name === 'AbortError'
  )
    return
  const code = typeof failure?.code === 'number' ? failure.code : undefined
  const status = typeof failure?.status === 'number' ? failure.status : undefined
  const warning =
    isPermissionError(code, status) ||
    (code !== AuthErrors.INVALID_CREDENTIALS.code && isUnauthorizedError(code, status))
  const message =
    code !== undefined && typeof failure?.message === 'string' && failure.message.trim()
      ? failure.message
      : (options.message ?? '操作失败，请稍后重试')
  return Notification[warning ? 'warning' : 'error']({
    title: options.title ?? (warning ? '操作受限' : '操作失败'),
    message
  })
}

/** 每个客户端由请求层按会话合并 401，此处作为统一会话失效提醒入口。 */
export const notifySessionExpired = () =>
  Notification.warning({ title: '登录失效', message: AuthErrors.SESSION_EXPIRED.msg })
