<script setup lang="ts">
import type { RoleListItem } from '../types'

defineProps<{ role: RoleListItem | null; loading: boolean }>()
const visible = defineModel<boolean>({ default: false })
defineEmits<{ retry: [] }>()
</script>

<template>
  <el-drawer
    v-model="visible"
    title="角色详情"
    direction="rtl"
    size="min(560px, 100vw)"
    append-to-body
    destroy-on-close
  >
    <div v-loading="loading" class="role-details-body">
      <el-descriptions
        v-if="role"
        :column="1"
        :border="false"
        :label-width="90"
        class="role-details"
      >
        <el-descriptions-item label="角色ID">{{ role.roleId }}</el-descriptions-item>
        <el-descriptions-item label="角色名称">{{ role.roleName }}</el-descriptions-item>
        <el-descriptions-item label="角色编码">{{ role.roleCode }}</el-descriptions-item>
        <el-descriptions-item label="角色状态">{{
          role.roleStatus === 1 ? '启用' : '停用'
        }}</el-descriptions-item>
        <el-descriptions-item label="成员数量">{{ role.memberCount }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ role.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ role.createTime }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ role.updateTime }}</el-descriptions-item>
      </el-descriptions>
      <el-empty v-else-if="!loading" description="暂未获取到角色详情">
        <el-button type="primary" @click="$emit('retry')">重新加载</el-button>
      </el-empty>
    </div>
  </el-drawer>
</template>

<style scoped>
.role-details-body {
  min-height: 160px;
}
.role-details :deep(.el-descriptions__content) {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
</style>
