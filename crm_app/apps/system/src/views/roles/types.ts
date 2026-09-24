import type { RoleStatus } from '@common-crm/types/api'
export type { RoleListItem, RoleStatus } from '@common-crm/types/api'

export interface RoleFilters {
  keyword: string
  roleStatus: RoleStatus | ''
}
export interface RoleFormValues {
  roleName: string
  roleCode: string
  roleStatus: RoleStatus
  remark: string
}
