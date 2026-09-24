<script setup lang="ts">
import { computed, ref } from 'vue'
import { CrmFilterBar, CrmTable } from '@common-crm/components'
import { RoleDetails, RoleEditor, RoleToolbar, RolePermissions } from './components'
import { authorization } from '../../services'
import { roleActions, roleColumns, roleFilterFields } from './config'
import { useRoleActions, useRoleDetails, useRoleList } from './hooks'
import type { RoleListItem } from './types'

const {
  filters,
  roles,
  selectedRoles,
  currentPage,
  pageSize,
  total,
  loading,
  refreshRoleList,
  searchRoles,
  resetRoleFilters,
  selectRoles
} = useRoleList()
const {
  editorVisible,
  editingRole,
  saving,
  mutating,
  openCreateRole,
  openEditRole,
  saveRole,
  changeRoleStatus,
  deleteSelectedRole,
  deleteSelectedRoles
} = useRoleActions(refreshRoleList)
const { detailsVisible, detailRole, detailLoading, openRoleDetails, loadRoleDetails } =
  useRoleDetails()
const busy = computed(() => loading.value || saving.value || mutating.value)
const can = authorization.hasPermission
const permissionVisible = ref(false)
const permissionRole = ref<RoleListItem | null>(null)

const executeRoleAction = (key: string, row: RoleListItem) => {
  if (busy.value) return
  if (key === 'view') openRoleDetails(row)
  else if (key === 'edit') openEditRole(row)
  else if (key === 'delete') void deleteSelectedRole(row)
  else if (key === 'assignPermissions') {
    permissionRole.value = row
    permissionVisible.value = true
  }
}
</script>

<template>
  <section class="role-management" aria-label="角色管理">
    <CrmFilterBar
      v-model="filters"
      :fields="roleFilterFields"
      :loading="busy"
      @search="searchRoles"
      @reset="resetRoleFilters"
    />
    <RoleToolbar
      :can-create="can('system:roles:create')"
      :can-delete="can('system:roles:batchDelete')"
      :selected-count="selectedRoles.length"
      :disabled="busy"
      @create="openCreateRole"
      @delete-selected="deleteSelectedRoles(selectedRoles)"
    />
    <CrmTable
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :data="roles"
      :columns="roleColumns"
      :actions="roleActions"
      :has-permission="can"
      :action-column="{ width: 140, inlineActionCount: 2 }"
      :loading="busy"
      :total="total"
      pagination-mode="server"
      row-key="roleId"
      empty-text="暂无角色数据"
      @action="executeRoleAction"
      @page-change="refreshRoleList"
      @selection-change="selectRoles"
    >
      <template #status="{ row }">
        <el-switch
          :model-value="row.roleStatus"
          :active-value="1"
          :inactive-value="0"
          :before-change="() => changeRoleStatus(row)"
          :disabled="busy || row.isSystem || !can('system:roles:updateRoleStatus')"
          class="role-status-switch"
          :aria-label="`${row.roleName}的角色状态：${row.roleStatus === 1 ? '启用' : '停用'}`"
        />
      </template>
    </CrmTable>
    <RoleEditor v-model="editorVisible" :role="editingRole" :saving="saving" @save="saveRole" />
    <RolePermissions v-model="permissionVisible" :role="permissionRole" />
    <RoleDetails
      v-model="detailsVisible"
      :role="detailRole"
      :loading="detailLoading"
      @retry="loadRoleDetails"
    />
  </section>
</template>

<style scoped>
.role-management {
  min-width: 0;
  min-height: calc(100vh - 64px);
  padding: 24px;
  background: var(--crm-color-surface);
}
.role-status-switch {
  --el-switch-on-color: var(--crm-color-primary);
  --el-switch-off-color: var(--crm-color-danger);
}
@media (max-width: 720px) {
  .role-management {
    padding: 16px;
  }
}
</style>
