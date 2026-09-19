<script setup lang="ts">
import type { Component } from 'vue'

export interface LayoutMenuItem {
  path: string
  title: string
  icon: Component
  disabled?: boolean
}

defineProps<{
  collapsed: boolean
  activeMenu: string
  items: LayoutMenuItem[]
}>()

const emit = defineEmits<{
  select: [path: string]
}>()
</script>

<template>
  <aside class="sidebar" :class="{ 'is-collapsed': collapsed }">
    <div class="sidebar-header">
      <div class="logo">
        <span class="logo-icon">C</span>
        <span v-show="!collapsed" class="logo-text">Common CRM</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :collapse-transition="false"
        @select="emit('select', $event)"
      >
        <el-menu-item
          v-for="item in items"
          :key="item.path"
          :index="item.path"
          :disabled="item.disabled"
        >
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <template #title>
            <span>{{ item.title }}</span>
            <el-tag v-if="item.disabled" size="small" type="info" class="menu-tag">敬请期待</el-tag>
          </template>
        </el-menu-item>
      </el-menu>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  width: 240px;
  height: 100vh;
  background: var(--crm-color-surface);
  border-right: 1px solid var(--crm-color-border);
  transition: width 0.28s ease;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  padding: 0 16px;
  border-bottom: 1px solid var(--crm-color-border);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(
    135deg,
    var(--crm-color-primary) 0%,
    var(--crm-color-primary-hover) 100%
  );
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
}

.logo-text {
  color: var(--crm-color-text);
  font-size: 16px;
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-nav :deep(.el-menu) {
  border-right: none;
  background: transparent;
}

.sidebar-nav :deep(.el-menu-item) {
  height: 48px;
  margin: 4px 12px;
  border-radius: 8px;
  line-height: 48px;
}

.sidebar-nav :deep(.el-menu-item.is-active) {
  background: var(--crm-color-primary-soft);
  color: var(--crm-color-primary);
}

.sidebar-nav :deep(.el-menu-item:hover) {
  background: var(--crm-color-surface-muted);
}

.sidebar-nav :deep(.el-menu-item.is-active:hover) {
  background: var(--crm-color-primary-soft);
}

.sidebar-nav :deep(.el-menu-item .el-icon) {
  font-size: 18px;
}

.menu-tag {
  margin-left: 8px;
}

.sidebar.is-collapsed {
  width: 64px;
}

.sidebar.is-collapsed .sidebar-nav :deep(.el-menu-item) {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 4px 8px;
  padding: 0 !important;
}

.sidebar.is-collapsed .sidebar-nav :deep(.el-menu-tooltip__trigger) {
  justify-content: center;
  padding: 0;
}

.sidebar.is-collapsed .sidebar-nav :deep(.el-menu-item .el-icon) {
  margin-right: 0 !important;
}

:global(:root[data-theme='dark']) .sidebar {
  border-color: rgb(255 255 255 / 10%);
}
</style>
