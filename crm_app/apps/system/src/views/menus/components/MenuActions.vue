<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'
import { CrmTable } from '@common-crm/components'
import type { TableAction, TableColumn } from '@common-crm/components'
import type { MenuActionItem, MenuItem } from '../types'
import { authorization } from '../../../services'

const visible = defineModel<boolean>({ default: false })
defineProps<{ menu: MenuItem | null; saving: boolean }>()
const emit = defineEmits<{
  create: []
  edit: [action: MenuActionItem]
  delete: [action: MenuActionItem]
}>()
const can = authorization.hasPermission
const columns: TableColumn<MenuActionItem>[] = [
  { prop: 'name', label: '按钮名称', minWidth: 140 },
  { prop: 'permissionCode', label: '权限标识', minWidth: 210 },
  { prop: 'enabled', label: '状态', width: 80, formatter: row => (row.enabled ? '启用' : '停用') },
  {
    prop: 'rules',
    label: '接口',
    minWidth: 220,
    formatter: row => row.rules.map(rule => `${rule.httpMethod} ${rule.path}`).join('；') || '-'
  }
]
const actions: TableAction<MenuActionItem>[] = [
  { key: 'edit', label: '编辑按钮', icon: 'Edit', permission: 'system:menus:editAction' },
  {
    key: 'delete',
    label: '删除按钮',
    icon: 'Delete',
    type: 'danger',
    permission: 'system:menus:deleteAction'
  }
]
const executeAction = (key: string, action: MenuActionItem) => {
  if (key === 'edit') emit('edit', action)
  else if (key === 'delete') emit('delete', action)
}
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="`${menu?.name ?? ''} · 按钮权限`"
    size="min(1000px, 100vw)"
    :close-on-click-modal="false"
  >
    <el-descriptions :column="1"
      ><el-descriptions-item label="菜单权限">{{ menu?.permissionCode }}</el-descriptions-item
      ><el-descriptions-item label="路由">{{
        menu?.routePath
      }}</el-descriptions-item></el-descriptions
    >
    <el-button
      v-if="can('system:menus:createAction')"
      type="primary"
      :icon="Plus"
      :disabled="saving"
      class="add-action"
      @click="emit('create')"
      >新增按钮</el-button
    >
    <CrmTable
      :data="menu?.actions ?? []"
      :columns="columns"
      :actions="actions"
      :has-permission="can"
      :selection="false"
      :pagination="false"
      :loading="saving"
      row-key="actionId"
      :action-column="{ width: 110 }"
      @action="executeAction"
    />
  </el-drawer>
</template>

<style scoped>
.add-action {
  margin: 8px 0 16px;
}
</style>
