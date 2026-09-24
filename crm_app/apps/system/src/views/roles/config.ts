import type { FilterField, TableAction, TableColumn } from '@common-crm/components'
import type { RoleFilters, RoleListItem } from './types'

export const roleFilterFields: FilterField<RoleFilters>[] = [
  {
    prop: 'keyword',
    label: '角色ID、名称或编码',
    type: 'input',
    width: 300,
    props: { maxlength: 255 }
  },
  {
    prop: 'roleStatus',
    label: '角色状态',
    type: 'select',
    options: [
      { label: '启用', value: 1 },
      { label: '停用', value: 0 }
    ]
  }
]
export const roleColumns: TableColumn<RoleListItem>[] = [
  { prop: 'roleName', label: '角色名称', minWidth: 160 },
  { prop: 'roleCode', label: '角色编码', minWidth: 180 },
  { prop: 'roleStatus', label: '角色状态', width: 110, slot: 'status' },
  { prop: 'memberCount', label: '成员数量', width: 110 },
  { prop: 'remark', label: '备注', minWidth: 200 },
  { prop: 'createTime', label: '创建时间', minWidth: 180 },
  { prop: 'updateTime', label: '更新时间', minWidth: 180 }
]
export const roleActions: TableAction<RoleListItem>[] = [
  { key: 'view', label: '查看详情', icon: 'View', permission: 'system:roles:view' },
  {
    key: 'edit',
    label: '编辑角色',
    icon: 'Edit',
    permission: 'system:roles:edit',
    disabled: row => row.isSystem
  },
  {
    key: 'assignPermissions',
    label: '分配权限',
    icon: 'Key',
    permission: 'system:roles:assignPermissions'
  },
  {
    key: 'delete',
    permission: 'system:roles:delete',
    label: '删除角色',
    icon: 'Delete',
    type: 'danger',
    disabled: row => row.isSystem
  }
]
