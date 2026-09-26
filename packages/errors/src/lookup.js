import { CommonErrors } from './common.js'
import { AuthErrors } from './auth.js'
import { UserErrors } from './users.js'
import { RoleErrors } from './roles.js'
import { MenuErrors } from './menus.js'
import { FileErrors } from './files.js'

// 不通过 key 合并目录：不同模块允许同名的语义常量。
/** @type {import('./types.js').ErrorDefinition[]} */
const allDefinitions = [
  CommonErrors,
  AuthErrors,
  UserErrors,
  RoleErrors,
  MenuErrors,
  FileErrors
].flatMap(catalog => Object.values(catalog))
const byCode = new Map(allDefinitions.map(item => [Number(item.code), item]))

/** @param {number | undefined} code @returns {import('./types.js').ErrorDefinition | undefined} */
export const getErrorDefinition = code => (code === undefined ? undefined : byCode.get(code))

/** @param {number | undefined} code @param {number | undefined} [status] */
export const isUnauthorizedError = (code, status) =>
  status === 401 || code === 401 || getErrorDefinition(code)?.httpStatus === 401

/** @param {number | undefined} code @param {number | undefined} [status] */
export const isPermissionError = (code, status) =>
  status === 403 || code === 403 || getErrorDefinition(code)?.httpStatus === 403
