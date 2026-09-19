<script setup lang="ts">
import {
  Bell,
  Close,
  Menu as IconMenu,
  Moon,
  Search,
  Setting,
  Sunny,
  User
} from '@element-plus/icons-vue'

export interface BreadcrumbItem {
  title: string
  to?: string
}

defineProps<{
  breadcrumbItems: BreadcrumbItem[]
  isDark: boolean
}>()

const emit = defineEmits<{
  toggleSidebar: []
  toggleTheme: []
  logout: []
}>()
</script>

<template>
  <header class="header">
    <div class="header-left">
      <el-button text class="header-action" aria-label="折叠侧栏" @click="emit('toggleSidebar')">
        <el-icon><IconMenu /></el-icon>
      </el-button>
      <div class="breadcrumb">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item v-for="item in breadcrumbItems" :key="item.title" :to="item.to">
            {{ item.title }}
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <div class="header-right">
      <el-button text class="header-action" title="搜索" aria-label="搜索">
        <el-icon><Search /></el-icon>
      </el-button>
      <el-button text class="header-action" title="通知" aria-label="通知">
        <el-icon><Bell /></el-icon>
      </el-button>
      <el-button
        text
        class="header-action"
        :title="isDark ? '切换到亮色模式' : '切换到暗色模式'"
        :aria-label="isDark ? '切换到亮色模式' : '切换到暗色模式'"
        @click="emit('toggleTheme')"
      >
        <el-icon>
          <Sunny v-if="isDark" />
          <Moon v-else />
        </el-icon>
      </el-button>

      <el-dropdown trigger="click">
        <div class="user-info">
          <el-avatar :size="32" class="user-avatar">
            <el-icon><User /></el-icon>
          </el-avatar>
          <span class="user-name">Admin</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>
              <el-icon class="dropdown-item-icon"><User /></el-icon>
              个人中心
            </el-dropdown-item>
            <el-dropdown-item>
              <el-icon class="dropdown-item-icon"><Setting /></el-icon>
              系统设置
            </el-dropdown-item>
            <el-dropdown-item divided @click="emit('logout')">
              <el-icon class="dropdown-item-icon"><Close /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 99;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  background: var(--crm-color-surface);
  border-bottom: 1px solid var(--crm-color-border);
  backdrop-filter: blur(8px);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-action {
  width: 40px;
  height: 40px;
  padding: 0;
  color: var(--crm-color-text-muted);
  font-size: 18px;
}

.header-action:hover {
  color: var(--crm-color-primary);
  background: var(--crm-color-surface-muted);
}

.breadcrumb {
  margin-left: 8px;
  color: var(--crm-color-text);
  font-size: 16px;
  font-weight: 500;
}

.breadcrumb :deep(.el-breadcrumb) {
  font-size: inherit;
  line-height: 1.5;
}

.breadcrumb :deep(.el-breadcrumb__inner) {
  color: var(--crm-color-text-muted);
  font-weight: 500;
}

.breadcrumb :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: var(--crm-color-text);
}

.breadcrumb :deep(.el-breadcrumb__separator) {
  color: var(--crm-color-text-muted);
  font-weight: 400;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 4px;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.user-info:hover {
  background: var(--crm-color-surface-muted);
}

.user-avatar {
  color: var(--crm-color-primary);
  background: var(--crm-color-primary-soft);
}

.user-name {
  color: var(--crm-color-text);
  font-size: 14px;
  font-weight: 500;
}

:deep(.el-dropdown-menu__item) {
  line-height: 20px;
}

.dropdown-item-icon {
  width: 16px;
  min-width: 16px;
  margin-right: 5px;
  justify-content: center;
  flex-shrink: 0;
}

:global(:root[data-theme='dark']) .header {
  border-color: rgb(255 255 255 / 10%);
}

@media (max-width: 768px) {
  .header {
    padding: 0 16px;
  }

  .user-name {
    display: none;
  }
}
</style>
