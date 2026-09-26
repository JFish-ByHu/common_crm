import { defineError } from './types.js'

export const UserErrors = Object.freeze({
  USER_NOT_FOUND: defineError(120001, 404, '用户不存在，请刷新后重试'),
  USERNAME_EXISTS: defineError(120002, 409, '用户名已存在'),
  EMAIL_EXISTS: defineError(120003, 409, '邮箱已被使用'),
  USER_CONFLICT: defineError(120004, 409, '用户名或邮箱已存在'),
  INVALID_INPUT: defineError(120005, 400, '用户参数无效或没有可更新的字段'),
  SYSTEM_USER_PROTECTED: defineError(120006, 403, '系统管理员账号不能停用、删除或被其他用户修改')
})
