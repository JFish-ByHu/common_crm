import { ApiError } from '../../../services'

export const getUserErrorMessage = (error: unknown, fallback: string): string => {
  if (!(error instanceof ApiError)) return fallback
  if (error.status === 401 || error.code === 401) return '登录已过期，请重新登录'
  if (error.code === 409) return '用户名或邮箱已被使用'
  if (error.kind === 'business' && error.code === 404) return '用户不存在，请刷新列表后重试'
  if (error.status === 422 || error.code === 422) return '提交的参数不符合要求，请检查后重试'
  return error.message || fallback
}
