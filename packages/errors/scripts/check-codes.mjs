import {
  AuthErrors,
  CommonErrors,
  FileErrors,
  MenuErrors,
  RoleErrors,
  UserErrors
} from '../src/index.js'

const catalogs = [
  [CommonErrors, 10],
  [AuthErrors, 11],
  [UserErrors, 12],
  [RoleErrors, 13],
  [MenuErrors, 14],
  [FileErrors, 15]
]
const used = new Set()
for (const [catalog, prefix] of catalogs) {
  for (const [name, definition] of Object.entries(catalog)) {
    if (
      !Number.isInteger(definition.code) ||
      Math.floor(definition.code / 10000) !== prefix ||
      used.has(definition.code)
    ) {
      throw new Error(`错误码重复或号段无效：${name} (${definition.code})`)
    }
    if (
      !Number.isInteger(definition.httpStatus) ||
      definition.httpStatus < 400 ||
      definition.httpStatus > 599
    ) {
      throw new Error(`HTTP 错误状态无效：${name}`)
    }
    if (
      typeof definition.msg !== 'function' &&
      (typeof definition.msg !== 'string' || !definition.msg.trim())
    ) {
      throw new Error(`错误文案无效：${name}`)
    }
    used.add(definition.code)
  }
}
console.log(`错误目录校验通过：${used.size} 个唯一业务码`)
