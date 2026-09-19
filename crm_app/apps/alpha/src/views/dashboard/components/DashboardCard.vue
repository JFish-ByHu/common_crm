<script setup lang="ts">
import type { Component } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'

withDefaults(
  defineProps<{
    title: string
    description: string
    icon: Component
    status?: string
    actionText?: string
    disabled?: boolean
  }>(),
  {
    status: '待接入数据',
    actionText: '查看详情',
    disabled: false
  }
)

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <article class="dashboard-card" :class="{ 'is-disabled': disabled }">
    <div class="card-header">
      <span class="card-icon" aria-hidden="true">
        <el-icon><component :is="icon" /></el-icon>
      </span>
      <span class="card-status">{{ status }}</span>
    </div>

    <div class="card-content">
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>

    <el-button class="card-action" :disabled="disabled" text type="primary" @click="emit('action')">
      {{ disabled ? '即将开放' : actionText }}
      <el-icon><ArrowRight /></el-icon>
    </el-button>
  </article>
</template>

<style scoped>
.dashboard-card {
  display: flex;
  min-height: 216px;
  flex-direction: column;
  padding: 24px;
  border: 1px solid var(--crm-color-border);
  border-radius: var(--crm-radius-md);
  background: var(--crm-color-surface);
  transition:
    border-color var(--crm-transition-fast),
    background-color var(--crm-transition-fast),
    transform var(--crm-transition-fast);
}

.dashboard-card:hover:not(.is-disabled) {
  border-color: var(--crm-color-primary);
  background: var(--crm-color-surface-muted);
  transform: translateY(-2px);
}

.dashboard-card.is-disabled {
  opacity: 0.68;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
}

.card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--crm-radius-md);
  color: var(--crm-color-primary);
  background: var(--crm-color-primary-soft);
  font-size: 20px;
}

.card-status {
  color: var(--crm-color-text-muted);
  font-size: 12px;
}

.card-content {
  flex: 1;
  padding: 24px 0 16px;
}

.card-content h2 {
  color: var(--crm-color-text);
  font-size: 18px;
  font-weight: 600;
}

.card-content p {
  margin-top: 8px;
  color: var(--crm-color-text-muted);
  font-size: 14px;
  line-height: 1.6;
}

.card-action {
  align-self: flex-start;
  min-height: 32px;
  padding: 4px 0;
}

.card-action :deep(.el-icon) {
  margin-left: 4px;
}
</style>
