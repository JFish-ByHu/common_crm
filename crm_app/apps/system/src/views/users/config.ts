import type { FilterField, TableAction, TableColumn } from '@common-crm/components'
import type { UserFilters, UserListItem } from './types'

export const userFilterFields: FilterField<UserFilters>[] = [
  {
    prop: 'keyword',
    label: '用户ID、用户名或邮箱',
    type: 'input',
    width: 300,
    props: { maxlength: 255 }
  },
  {
    prop: 'accountStatus',
    label: '账号状态',
    type: 'select',
    options: [
      { label: '正常', value: 1 },
      { label: '停用', value: 0 }
    ]
  }
]

export const userColumns: TableColumn<UserListItem>[] = [
  { prop: 'userId', label: '用户ID', minWidth: 220 },
  { prop: 'username', label: '用户名', minWidth: 180 },
  { prop: 'email', label: '邮箱', minWidth: 240, formatter: row => row.email || '-' },
  { prop: 'accountStatus', label: '账号状态', width: 110, slot: 'status' },
  { prop: 'onlineStatus', label: '在线状态', width: 110, slot: 'onlineStatus' },
  {
    prop: 'createTime',
    label: '创建时间',
    minWidth: 180
  },
  {
    prop: 'updateTime',
    label: '更新时间',
    minWidth: 180
  }
]

export const userActions: TableAction<UserListItem>[] = [
  { key: 'view', label: '查看详情', icon: 'View', permission: 'system:users:view' },
  { key: 'edit', label: '编辑用户', icon: 'Edit', permission: 'system:users:edit' },
  { key: 'assignRoles', label: '分配角色', icon: 'User', permission: 'system:users:assignRoles' },
  {
    key: 'logout',
    label: '强制登出',
    icon: 'SwitchButton',
    type: 'warning',
    permission: 'system:users:logout'
  },
  {
    key: 'delete',
    label: '删除用户',
    icon: 'Delete',
    type: 'danger',
    permission: 'system:users:delete'
  }
]
