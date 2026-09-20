<script setup lang="ts">
import { ref } from 'vue'
import { CrmFilterBar, CrmTable } from '@common-crm/components'
import { UserDetails } from './components'
import { userActions, userColumns, userFilterFields } from './config'
import { useUserList } from './hooks'
import type { UserListItem } from './types'

const { filters, visibleUsers, currentPage, pageSize, applyFilters, resetFilters } = useUserList()
const detailsVisible = ref(false)
const selectedUser = ref<UserListItem | null>(null)

function handleAction(key: string, row: UserListItem) {
  if (key === 'view') {
    selectedUser.value = row
    detailsVisible.value = true
  }
}
</script>

<template>
  <section class="user-management" aria-label="用户管理">
    <CrmFilterBar
      v-model="filters"
      :fields="userFilterFields"
      @search="applyFilters"
      @reset="resetFilters"
    />
    <CrmTable
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :data="visibleUsers"
      :columns="userColumns"
      :actions="userActions"
      row-key="userId"
      empty-text="暂无用户数据"
      @action="handleAction"
    >
      <template #status="{ row }">
        <el-tag :type="row.status === 'active' ? 'success' : 'info'" effect="plain">
          {{ row.status === 'active' ? '正常' : '停用' }}
        </el-tag>
      </template>
    </CrmTable>
    <UserDetails v-model="detailsVisible" :user="selectedUser" />
  </section>
</template>

<style scoped>
.user-management {
  min-width: 0;
  min-height: calc(100vh - 64px);
  padding: 24px;
  background: var(--crm-color-surface);
}

@media (max-width: 720px) {
  .user-management {
    padding: 16px;
  }
}
</style>
