<script setup lang="ts">
import { UserFilterBar, UserTable } from './components'
import { useUserList } from './hooks'
import type { UserFilters } from './types'

const { filters, visibleUsers, applyFilters, resetFilters } = useUserList()

const updateFilters = (value: UserFilters) => {
  Object.assign(filters, value)
}
</script>

<template>
  <section class="user-management" aria-labelledby="user-management-title">
    <header class="page-header">
      <div>
        <h1 id="user-management-title">用户管理</h1>
        <p>管理平台账号及账号状态</p>
      </div>
    </header>

    <UserFilterBar
      :model-value="filters"
      @update:model-value="updateFilters"
      @search="applyFilters"
      @reset="resetFilters"
    />

    <div class="table-region">
      <UserTable :users="visibleUsers" />
    </div>
  </section>
</template>

<style scoped>
.user-management {
  min-height: calc(100vh - 64px);
  padding: 24px;
  background: var(--crm-color-surface);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
}

.page-header h1 {
  color: var(--crm-color-text);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.4;
}

.page-header p {
  margin-top: 4px;
  color: var(--crm-color-text-muted);
  font-size: 14px;
}

.table-region {
  padding-top: 16px;
  overflow-x: auto;
}

@media (max-width: 720px) {
  .user-management {
    padding: 16px;
  }
}
</style>
