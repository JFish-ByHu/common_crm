export const RoleStatus = { DISABLED: 0, ACTIVE: 1 } as const
export type RoleStatusValue = (typeof RoleStatus)[keyof typeof RoleStatus]

export interface RoleSearch {
  keyword?: string
  roleStatus?: RoleStatusValue
  pagination?: { page: number; pageSize: number }
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
