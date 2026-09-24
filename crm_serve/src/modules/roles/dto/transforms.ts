import type { TransformFnParams } from 'class-transformer'

export const trimString = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value

export const queryInteger = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value

export const normalizeRemark = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() || null : value
