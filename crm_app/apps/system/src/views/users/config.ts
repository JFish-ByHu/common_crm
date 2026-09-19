import type { FilterField, TableAction, TableColumn } from '@common-crm/components'
import type { UserFilters, UserListItem } from './types'

export const userFilterFields: FilterField<UserFilters>[] = [
  { prop: 'keyword', label: '用户名或邮箱', type: 'input' },
  {
    prop: 'status',
    label: '账号状态',
    type: 'select',
    options: [
      { label: '正常', value: 'active' },
      { label: '停用', value: 'disabled' }
    ]
  },
  { prop: 'updatedAt', label: '更新时间', type: 'date-picker' }
]

export const userColumns: TableColumn<UserListItem>[] = [
  { prop: 'username', label: '用户名', minWidth: 180 },
  { prop: 'email', label: '邮箱', minWidth: 240 },
  { prop: 'status', label: '状态', width: 120, slot: 'status' },
  { prop: 'updatedAt', label: '更新时间', minWidth: 180 }
]

export const userActions: TableAction<UserListItem>[] = [
  { key: 'view', label: '查看详情', icon: 'View' }
]
