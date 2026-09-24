import type { TransformFnParams } from 'class-transformer'

export const normalizeRemark = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() || null : value
