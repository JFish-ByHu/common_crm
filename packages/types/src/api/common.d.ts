/** 前后端统一响应；失败或无返回数据时 data 为 null。 */
export interface ApiResponse<T = unknown> {
  code: number
  data: T | null
  msg: string
}

export interface PageRequest {
  page: number
  pageSize: number
}

/** 两项都不传时查询全部；传任意一项时启用分页。 */
export type OptionalPageRequest = Partial<PageRequest>

export interface PageResponse<T> {
  list: T[]
  total: number
  /** 未启用分页时为 null。 */
  page: number | null
  pageSize: number | null
}

export interface DeleteCountResponse {
  deletedCount: number
}
