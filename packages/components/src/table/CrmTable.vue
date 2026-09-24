<script setup lang="ts" generic="Row extends object">
import { computed, ref, watch } from 'vue'
import {
  ElButton,
  ElConfigProvider,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElIcon,
  ElPagination,
  ElTable,
  ElTableColumn,
  ElTooltip,
  vLoading,
  type TableInstance
} from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { resolveTableIcon } from './icons'
import type { TableAction, TableActionColumn, TableColumn, TablePageChange } from './types'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    data: Row[]
    columns?: TableColumn<Row>[]
    actions?: TableAction<Row>[]
    hasPermission?: (permission: string) => boolean
    actionColumn?: TableActionColumn
    showActions?: boolean
    border?: boolean
    selection?: boolean
    rowKey?: string | ((row: Row) => string)
    reserveSelection?: boolean
    loading?: boolean
    emptyText?: string
    pagination?: boolean
    paginationMode?: 'client' | 'server'
    total?: number
    pageSizes?: number[]
  }>(),
  {
    columns: () => [],
    actions: () => [],
    hasPermission: undefined,
    actionColumn: () => ({}),
    showActions: true,
    border: true,
    selection: true,
    rowKey: undefined,
    reserveSelection: false,
    loading: false,
    emptyText: '暂无数据',
    pagination: true,
    paginationMode: 'client',
    total: undefined,
    pageSizes: () => [10, 20, 50, 100]
  }
)

const currentPage = defineModel<number>('currentPage', { default: 1 })
const pageSize = defineModel<number>('pageSize', { default: 10 })
const emit = defineEmits<{
  action: [key: string, row: Row, index: number]
  'selection-change': [rows: Row[]]
  'page-change': [page: TablePageChange]
}>()

const tableRef = ref<TableInstance>()
const totalRows = computed(() =>
  props.paginationMode === 'server' ? (props.total ?? props.data.length) : props.data.length
)
const visibleRows = computed(() => {
  if (!props.pagination || props.paginationMode === 'server') return props.data
  const start = (currentPage.value - 1) * pageSize.value
  return props.data.slice(start, start + pageSize.value)
})

const changePage = (page: number) => {
  if (page === currentPage.value) return
  currentPage.value = page
  emit('page-change', { currentPage: page, pageSize: pageSize.value })
}

const changePageSize = (size: number) => {
  if (size === pageSize.value) return
  pageSize.value = size
  currentPage.value = 1
  emit('page-change', { currentPage: 1, pageSize: size })
}

// 本地筛选缩小结果后回到有效页；接口分页由页面根据服务端 total 管理。
watch([totalRows, pageSize], () => {
  if (props.pagination && props.paginationMode === 'client') {
    const lastPage = Math.max(1, Math.ceil(totalRows.value / pageSize.value))
    if (currentPage.value > lastPage) changePage(lastPage)
  }
})

const isDisabled = (action: TableAction<Row>, row: Row) => {
  return (
    props.loading ||
    (typeof action.disabled === 'function' ? action.disabled(row) : action.disabled)
  )
}

const isVisible = (action: TableAction<Row>, row: Row) =>
  (action.permission === undefined || props.hasPermission?.(action.permission) === true) &&
  !(typeof action.hidden === 'function' ? action.hidden(row) : action.hidden)

const rowActions = (row: Row) => props.actions.filter(action => isVisible(action, row))

const inlineActions = (row: Row) => {
  return rowActions(row).slice(0, Math.max(0, props.actionColumn.inlineActionCount ?? 2))
}

const overflowActions = (row: Row) => {
  return rowActions(row).slice(Math.max(0, props.actionColumn.inlineActionCount ?? 2))
}

const emitAction = (action: TableAction<Row>, row: Row, index: number) => {
  if (props.actions.includes(action) && isVisible(action, row) && !isDisabled(action, row)) {
    emit('action', action.key, row, index)
  }
}

const emitOverflowAction = (command: { action: TableAction<Row>; row: Row; index: number }) => {
  emitAction(command.action, command.row, command.index)
}

defineExpose({
  doLayout: () => tableRef.value?.doLayout(),
  clearSelection: () => tableRef.value?.clearSelection(),
  toggleRowSelection: (row: Row, selected?: boolean) =>
    tableRef.value?.toggleRowSelection(row, selected),
  getSelectionRows: () => tableRef.value?.getSelectionRows() as Row[] | undefined
})
</script>

<template>
  <ElConfigProvider :locale="zhCn">
    <div class="crm-table-region">
      <ElTable
        ref="tableRef"
        v-loading="loading"
        v-bind="$attrs"
        :data="visibleRows"
        :border="border"
        :row-key="rowKey"
        :empty-text="emptyText"
        class="crm-table"
        @selection-change="emit('selection-change', $event)"
      >
        <ElTableColumn
          v-if="selection"
          type="selection"
          width="48"
          fixed="left"
          align="center"
          :reserve-selection="reserveSelection && !!rowKey"
        />
        <slot>
          <ElTableColumn
            v-for="column in columns"
            :key="column.prop"
            v-bind="column"
            :min-width="column.minWidth ?? 140"
            :show-overflow-tooltip="column.showOverflowTooltip ?? true"
          >
            <template #default="scope">
              <slot
                :name="column.slot ?? column.prop"
                :row="scope.row"
                :column="scope.column"
                :index="scope.$index"
              >
                {{
                  column.formatter
                    ? column.formatter(
                        scope.row,
                        scope.column,
                        scope.row[column.prop],
                        scope.$index
                      )
                    : (scope.row[column.prop] ?? '-')
                }}
              </slot>
            </template>
          </ElTableColumn>
        </slot>
        <ElTableColumn
          v-if="showActions"
          :label="actionColumn.label ?? '操作'"
          :width="actionColumn.width ?? 120"
          :fixed="actionColumn.fixed ?? 'right'"
          align="center"
        >
          <template #default="scope">
            <slot name="actions" :row="scope.row" :index="scope.$index">
              <div class="crm-table-actions">
                <ElTooltip
                  v-for="action in inlineActions(scope.row)"
                  :key="action.key"
                  :content="action.label"
                  placement="top"
                  :disabled="action.showLabel || !action.icon"
                >
                  <span class="crm-table-action">
                    <ElButton
                      link
                      :type="action.type ?? 'primary'"
                      :icon="resolveTableIcon(action.icon)"
                      :aria-label="action.label"
                      :disabled="isDisabled(action, scope.row)"
                      @click.stop="emitAction(action, scope.row, scope.$index)"
                    >
                      <template v-if="action.showLabel || !resolveTableIcon(action.icon)">{{
                        action.label
                      }}</template>
                    </ElButton>
                  </span>
                </ElTooltip>
                <ElDropdown
                  v-if="overflowActions(scope.row).length"
                  trigger="click"
                  @command="emitOverflowAction"
                >
                  <ElButton
                    link
                    type="primary"
                    :icon="resolveTableIcon('MoreFilled')"
                    aria-label="更多操作"
                    @click.stop
                  />
                  <template #dropdown>
                    <ElDropdownMenu>
                      <ElDropdownItem
                        v-for="action in overflowActions(scope.row)"
                        :key="action.key"
                        :command="{ action, row: scope.row, index: scope.$index }"
                        :disabled="isDisabled(action, scope.row)"
                        :class="{ 'crm-table-dropdown-danger': action.type === 'danger' }"
                      >
                        <ElIcon v-if="resolveTableIcon(action.icon)">
                          <component :is="resolveTableIcon(action.icon)" />
                        </ElIcon>
                        {{ action.label }}
                      </ElDropdownItem>
                    </ElDropdownMenu>
                  </template>
                </ElDropdown>
              </div>
            </slot>
          </template>
        </ElTableColumn>
        <template v-if="$slots.empty" #empty><slot name="empty" /></template>
        <template v-if="$slots.append" #append><slot name="append" /></template>
      </ElTable>
      <div v-if="pagination" class="crm-table-pagination">
        <ElPagination
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="pageSizes"
          :total="totalRows"
          :pager-count="5"
          :disabled="loading"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @update:current-page="changePage"
          @update:page-size="changePageSize"
        />
      </div>
    </div>
  </ElConfigProvider>
</template>

<style scoped>
.crm-table-region,
.crm-table {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
}

.crm-table {
  box-shadow: var(--el-box-shadow-lighter);
}

.crm-table-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.crm-table-action {
  display: inline-flex;
}

.crm-table-action :deep(.el-button) {
  min-width: 28px;
  min-height: 28px;
}

.crm-table-actions :deep(.el-dropdown) {
  display: inline-flex;
}

.crm-table-actions :deep(.el-dropdown .el-button) {
  min-width: 28px;
  min-height: 28px;
}

:global(.crm-table-dropdown-danger) {
  color: var(--crm-color-danger);
}

.crm-table-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}

.crm-table-pagination :deep(.el-pagination) {
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 720px) {
  .crm-table-pagination,
  .crm-table-pagination :deep(.el-pagination) {
    justify-content: flex-start;
  }

  .crm-table-pagination :deep(.el-pagination) {
    width: 100%;
  }

  .crm-table-pagination :deep(.el-pagination::before) {
    flex-basis: 100%;
    order: 1;
    content: '';
  }

  .crm-table-pagination :deep(.btn-prev),
  .crm-table-pagination :deep(.el-pager),
  .crm-table-pagination :deep(.btn-next) {
    order: 2;
  }

  .crm-table-pagination :deep(.el-pagination__jump) {
    display: none;
  }
}
</style>
