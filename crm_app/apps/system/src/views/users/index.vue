<script setup lang="ts">
import { computed, ref } from 'vue'
import { CrmFilterBar, CrmTable } from '@common-crm/components'
import { UserDetails, UserEditor, UserOnlineStatus, UserToolbar } from './components'
import { userActions, userColumns, userFilterFields } from './config'
import { useUserActions, useUserList, useUserPresence } from './hooks'
import type { UserListItem } from './types'

const {
  filters,
  users,
  selectedUsers,
  currentPage,
  pageSize,
  total,
  loading,
  refreshUserList,
  searchUsers,
  resetUserFilters,
  selectUsers
} = useUserList()
const {
  editorVisible,
  editingUser,
  saving,
  mutating,
  saveError,
  openCreateUser,
  openEditUser,
  saveUser,
  changeUserStatus,
  logoutUser,
  deleteSelectedUser,
  deleteSelectedUsers
} = useUserActions(refreshUserList)
const busy = computed(() => loading.value || saving.value || mutating.value)
useUserPresence(users, busy, currentPage, pageSize)
const detailsVisible = ref(false)
const selectedUser = ref<UserListItem | null>(null)

const executeUserAction = (key: string, row: UserListItem) => {
  if (busy.value) return
  if (key === 'view') {
    selectedUser.value = row
    detailsVisible.value = true
  } else if (key === 'edit') {
    openEditUser(row)
  } else if (key === 'logout') {
    void logoutUser(row)
  } else if (key === 'delete') {
    void deleteSelectedUser(row)
  }
}
</script>

<template>
  <section class="user-management" aria-label="用户管理">
    <CrmFilterBar
      v-model="filters"
      :fields="userFilterFields"
      :loading="busy"
      @search="searchUsers"
      @reset="resetUserFilters"
    />
    <UserToolbar
      :selected-count="selectedUsers.length"
      :disabled="busy"
      @create="openCreateUser"
      @delete-selected="deleteSelectedUsers(selectedUsers)"
    />
    <CrmTable
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :data="users"
      :columns="userColumns"
      :actions="userActions"
      :action-column="{ width: 140, inlineActionCount: 2 }"
      :loading="busy"
      :total="total"
      pagination-mode="server"
      row-key="userId"
      empty-text="暂无用户数据"
      @action="executeUserAction"
      @page-change="refreshUserList"
      @selection-change="selectUsers"
    >
      <template #status="{ row }">
        <el-switch
          :model-value="row.accountStatus"
          :active-value="1"
          :inactive-value="0"
          :before-change="() => changeUserStatus(row)"
          :disabled="busy"
          class="user-status-switch"
          :aria-label="`${row.username}的账号状态：${row.accountStatus === 1 ? '正常' : '停用'}`"
        />
      </template>
      <template #onlineStatus="{ row }">
        <UserOnlineStatus :status="row.onlineStatus" />
      </template>
    </CrmTable>
    <UserDetails v-model="detailsVisible" :user="selectedUser" />
    <UserEditor
      v-model="editorVisible"
      :user="editingUser"
      :saving="saving"
      :error="saveError"
      @save="saveUser"
    />
  </section>
</template>

<style scoped>
.user-management {
  min-width: 0;
  min-height: calc(100vh - 64px);
  padding: 24px;
  background: var(--crm-color-surface);
}

.user-status-switch {
  --el-switch-on-color: var(--crm-color-primary);
  --el-switch-off-color: var(--crm-color-danger);
}

@media (max-width: 720px) {
  .user-management {
    padding: 16px;
  }
}
</style>
