<script setup lang="ts">
import { computed } from 'vue'
import type { UserOnlineStatus } from '../types'

const props = defineProps<{ status: UserOnlineStatus }>()
const statusLabel = computed(() =>
  props.status === 1 ? '在线' : props.status === 0 ? '离线' : '未知'
)
</script>

<template>
  <span class="user-online-status" :class="{ 'is-online': status === 1 }">
    <span class="user-online-status__dot" aria-hidden="true" />
    <span>{{ statusLabel }}</span>
  </span>
</template>

<style scoped>
.user-online-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  color: var(--crm-color-text-muted);
}

.user-online-status__dot {
  flex: 0 0 7px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--crm-color-info);
}

.is-online .user-online-status__dot {
  background: var(--crm-color-success);
}
</style>
