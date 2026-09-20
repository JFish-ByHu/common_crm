<script setup lang="ts">
import type { UserListItem } from '../types'

defineProps<{ user: UserListItem | null }>()
const visible = defineModel<boolean>({ default: false })
</script>

<template>
  <el-dialog
    v-model="visible"
    title="用户详情"
    width="min(560px, calc(100vw - 32px))"
    destroy-on-close
  >
    <el-descriptions v-if="user" :column="1" border class="user-details">
      <el-descriptions-item label="用户ID">{{ user.userId }}</el-descriptions-item>
      <el-descriptions-item label="用户名">{{ user.username }}</el-descriptions-item>
      <el-descriptions-item label="邮箱">{{ user.email || '-' }}</el-descriptions-item>
      <el-descriptions-item label="状态">{{
        user.accountStatus === 1 ? '正常' : '停用'
      }}</el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ user.createTime }}</el-descriptions-item>
      <el-descriptions-item label="更新时间">{{ user.updateTime }}</el-descriptions-item>
    </el-descriptions>
  </el-dialog>
</template>

<style scoped>
.user-details :deep(.el-descriptions__table) {
  table-layout: fixed;
}

.user-details :deep(.el-descriptions__label) {
  width: 90px;
}

.user-details :deep(.el-descriptions__content) {
  overflow-wrap: anywhere;
}
</style>
