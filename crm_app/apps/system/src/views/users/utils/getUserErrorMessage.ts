import { ApiError } from '../../../services'

export const getUserErrorMessage = (error: unknown, fallback: string): string => {
  if (!(error instanceof ApiError)) return fallback
  return error.message || fallback
}
