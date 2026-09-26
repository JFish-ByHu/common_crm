import { defineError } from './types.js'

export const AuthErrors = Object.freeze({
  INVALID_CREDENTIALS: defineError(110001, 401, '用户名或密码错误'),
  SESSION_EXPIRED: defineError(110002, 401, '登录已过期，请重新登录'),
  INVALID_REFRESH_TOKEN: defineError(110003, 401, '登录凭据已失效，请重新登录'),
  ACCOUNT_UNAVAILABLE: defineError(110004, 401, '账号不可用，请联系管理员'),
  PASSWORD_UNCHANGED: defineError(110005, 400, '新密码不能与原密码相同'),
  INVALID_INPUT: defineError(110006, 400, '认证参数无效')
})
