import type { TransformFnParams } from 'class-transformer'

export const trimString = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value

/** 只转换非空的十进制整数文本；其他输入交给 DTO 校验拒绝。 */
export const queryInteger = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value
