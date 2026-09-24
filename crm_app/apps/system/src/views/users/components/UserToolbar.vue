<script setup lang="ts">
import { Delete, Plus } from '@element-plus/icons-vue'

defineProps<{ selectedCount: number; disabled: boolean; canCreate: boolean; canDelete: boolean }>()
defineEmits<{ create: []; deleteSelected: [] }>()
</script>

<template>
  <div class="user-toolbar">
    <el-button
      v-if="canCreate"
      type="primary"
      :icon="Plus"
      :disabled="disabled"
      @click="$emit('create')"
    >
      新增用户
    </el-button>
    <el-button
      v-if="canDelete"
      type="danger"
      plain
      :icon="Delete"
      :disabled="disabled || !selectedCount"
      @click="$emit('deleteSelected')"
    >
      批量删除
    </el-button>
    <span v-if="selectedCount" class="user-selection-count">已选择 {{ selectedCount }} 位用户</span>
  </div>
</template>

<style scoped>
.user-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.user-toolbar :deep(.el-button + .el-button) {
  margin-left: 0;
}

.user-selection-count {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
</style>
