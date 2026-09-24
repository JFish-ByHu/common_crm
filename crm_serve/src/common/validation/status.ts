/** Prisma 的整数列须校验后再返回为公开的 0 / 1 状态，不通过类型断言掩盖异常数据。 */
export const parseBinaryStatus = (value: number): 0 | 1 => {
  if (value !== 0 && value !== 1) throw new Error('数据库中的启停状态无效')
  return value
}
