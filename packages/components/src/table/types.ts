import type { Component } from 'vue'
import type { ButtonProps, TableColumnCtx } from 'element-plus'
import type * as ElementPlusIcons from '@element-plus/icons-vue'

export interface TableColumn<Row extends object = Record<string, unknown>> {
  prop: Extract<keyof Row, string>
  label: string
  width?: number | string
  minWidth?: number | string
  fixed?: boolean | 'left' | 'right'
  align?: 'left' | 'center' | 'right'
  sortable?: boolean | 'custom'
  showOverflowTooltip?: boolean
  slot?: string
  formatter?: (row: Row, column: TableColumnCtx<Row>, value: unknown, index: number) => string
}

export interface TableAction<Row extends object = Record<string, unknown>> {
  key: string
  label: string
  icon?: keyof typeof ElementPlusIcons | `el-icon-${string}` | Component
  type?: ButtonProps['type']
  showLabel?: boolean
  disabled?: boolean | ((row: Row) => boolean)
  hidden?: boolean | ((row: Row) => boolean)
}

export interface TableActionColumn {
  label?: string
  width?: number | string
  fixed?: false | 'left' | 'right'
}

export interface TablePageChange {
  currentPage: number
  pageSize: number
}
