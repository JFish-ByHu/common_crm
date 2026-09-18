<script setup lang="ts">
import { computed } from 'vue'
import { Refresh, Search } from '@element-plus/icons-vue'
import type { UserFilters } from '../types'

const props = defineProps<{
  modelValue: UserFilters
}>()

const emit = defineEmits<{
  'update:modelValue': [value: UserFilters]
  search: []
  reset: []
}>()

const keyword = computed({
  get: () => props.modelValue.keyword,
  set: value => emit('update:modelValue', { ...props.modelValue, keyword: value })
})

const status = computed({
  get: () => props.modelValue.status,
  set: value => emit('update:modelValue', { ...props.modelValue, status: value })
})
</script>

<template>
  <div class="filter-bar">
    <el-input
      v-model="keyword"
      class="keyword-input"
      clearable
      placeholder="用户名或邮箱"
      aria-label="用户名或邮箱"
      @keyup.enter="emit('search')"
    />
    <el-select
      v-model="status"
      class="status-select"
      clearable
      placeholder="账号状态"
      aria-label="账号状态"
    >
      <el-option label="正常" value="active" />
      <el-option label="停用" value="disabled" />
    </el-select>
    <el-button type="primary" :icon="Search" @click="emit('search')">查询</el-button>
    <el-button :icon="Refresh" @click="emit('reset')">重置</el-button>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid var(--crm-color-border);
}

.keyword-input {
  width: min(320px, 100%);
}

.status-select {
  width: 160px;
}

@media (max-width: 720px) {
  .filter-bar {
    align-items: stretch;
    flex-wrap: wrap;
  }

  .keyword-input,
  .status-select {
    width: 100%;
  }
}
</style>
