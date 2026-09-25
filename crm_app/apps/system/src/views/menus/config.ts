import type { FilterField } from '@common-crm/components'
import type { MenuFilters } from './types'

export const menuFilterFields: FilterField<MenuFilters>[] = [
  {
    prop: 'keyword',
    label: '菜单名称、权限标识或路由',
    type: 'input',
    width: 320,
    props: { maxlength: 255 }
  }
]
