<script setup lang="ts">
import type { UserListItem } from '../types'

defineProps<{
  users: UserListItem[]
}>()
</script>

<template>
  <el-table :data="users" class="user-table" empty-text="暂无用户数据">
    <el-table-column prop="username" label="用户名" min-width="180" />
    <el-table-column prop="email" label="邮箱" min-width="240">
      <template #default="scope">
        {{ scope.row.email || '-' }}
      </template>
    </el-table-column>
    <el-table-column prop="status" label="状态" width="120">
      <template #default="scope">
        <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'" effect="plain">
          {{ scope.row.status === 'active' ? '正常' : '停用' }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="updatedAt" label="更新时间" min-width="180" />
  </el-table>
</template>

<style scoped>
.user-table {
  width: 100%;
}
</style>
