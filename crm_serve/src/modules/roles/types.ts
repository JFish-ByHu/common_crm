import type { PageRequest, RoleStatus as SharedRoleStatus } from '@common-crm/types/api'

export const RoleStatus = { DISABLED: 0, ACTIVE: 1 } as const satisfies Record<
  string,
  SharedRoleStatus
>
export type RoleStatusValue = SharedRoleStatus

export interface RoleSearch {
  keyword?: string
  roleStatus?: RoleStatusValue
  pagination?: PageRequest
}

export interface CreateRoleInput {
  roleId: string
  roleName: string
  roleCode: string
  roleStatus: RoleStatusValue
  remark: string | null
}

export interface UpdateRoleInput {
  roleName?: string
  roleStatus?: RoleStatusValue
  remark?: string | null
}
