import type { OptionalPageRequest, PageRequest } from '@common-crm/types/api'

export const MAX_PAGE_SIZE = 1000
export const MAX_PAGE_OFFSET = 2147483647
const DEFAULT_PAGE_SIZE = 20

/** DTO 完成入参校验后补齐分页默认值；业务模块保留自己的错误映射。 */
export const resolvePagination = (
  query: OptionalPageRequest,
  createInvalidInputError: () => Error
): PageRequest | undefined => {
  if (query.page === undefined && query.pageSize === undefined) return undefined
  const page = query.page ?? 1
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE
  if ((page - 1) * pageSize > MAX_PAGE_OFFSET) throw createInvalidInputError()
  return { page, pageSize }
}
