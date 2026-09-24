import type { RoleStatus } from '../../services'
export type { RoleListItem, RoleStatus } from '../../services'

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
