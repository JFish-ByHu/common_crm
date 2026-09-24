<script setup lang="ts">
import { Delete, Plus } from '@element-plus/icons-vue'

defineProps<{ selectedCount: number; disabled: boolean }>()
defineEmits<{ create: []; deleteSelected: [] }>()
</script>

<template>
  <div class="role-toolbar">
    <el-button type="primary" :icon="Plus" :disabled="disabled" @click="$emit('create')">
      新增角色
    </el-button>
    <el-button
      type="danger"
      plain
      :icon="Delete"
      :disabled="disabled || !selectedCount"
      @click="$emit('deleteSelected')"
    >
      批量删除
    </el-button>
    <span v-if="selectedCount" class="role-selection-count">已选择 {{ selectedCount }} 个角色</span>
  </div>
</template>

<style scoped>
.role-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.role-toolbar :deep(.el-button + .el-button) {
  margin-left: 0;
}
.role-selection-count {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
</style>
