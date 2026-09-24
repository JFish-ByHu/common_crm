import type { FilterField, TableAction, TableColumn } from '@common-crm/components'
import type { CustomerFilters, CustomerListItem } from './types'

export const customerFilterFields: FilterField<CustomerFilters>[] = [
  {
    prop: 'keyword',
    label: '客户名称、联系人或电话',
    type: 'input',
    width: 300
  },
  { prop: 'updatedAt', label: '更新时间', type: 'date-picker' }
]

export const customerColumns: TableColumn<CustomerListItem>[] = [
  { prop: 'name', label: '客户名称', minWidth: 220 },
  { prop: 'contactName', label: '联系人', minWidth: 160 },
  { prop: 'phone', label: '联系电话', minWidth: 160 },
  { prop: 'updatedAt', label: '更新时间', minWidth: 180 }
]

export const customerActions: TableAction<CustomerListItem>[] = [
  { key: 'view', label: '查看详情', icon: 'View', permission: 'customer:details:view' }
]
