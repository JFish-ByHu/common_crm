import type { TransformFnParams } from 'class-transformer'

export const normalizeEmail = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() || null : value

export const trimUserIds = ({ value }: TransformFnParams): unknown =>
  Array.isArray(value)
    ? value.map((item: unknown) => (typeof item === 'string' ? item.trim() : item))
    : value
