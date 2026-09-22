<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { Component } from 'vue'

export interface LayoutMenuItem {
  path: string
  title: string
  icon?: Component
  disabled?: boolean
  children?: LayoutMenuItem[]
}

const props = defineProps<{
  collapsed: boolean
  activeMenu: string
  items: LayoutMenuItem[]
}>()

const defaultOpeneds = props.items
  .filter(item => item.children?.some(child => child.path === props.activeMenu))
  .map(item => item.path)

const menuRef = ref<{ open: (index: string) => void }>()

watch(
  () => props.activeMenu,
  activePath => {
    const parent = props.items.find(item => item.children?.some(child => child.path === activePath))
    if (parent) {
      void nextTick(() => menuRef.value?.open(parent.path))
    }
  },
  { immediate: true }
)

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
        ref="menuRef"
        :default-active="activeMenu"
        :default-openeds="defaultOpeneds"
        :collapse="collapsed"
        :collapse-transition="false"
        @select="emit('select', $event)"
      >
        <template v-for="item in items" :key="item.path">
          <el-sub-menu v-if="item.children?.length" :index="item.path" :disabled="item.disabled">
            <template #title>
              <el-icon v-if="item.icon">
                <component :is="item.icon" />
              </el-icon>
              <span>{{ item.title }}</span>
              <el-tag v-if="item.disabled" size="small" type="info" class="menu-tag">
                敬请期待
              </el-tag>
            </template>

            <el-menu-item
              v-for="child in item.children"
              :key="child.path"
              :index="child.path"
              :disabled="child.disabled"
            >
              <span>{{ child.title }}</span>
            </el-menu-item>
          </el-sub-menu>

          <el-menu-item v-else :index="item.path" :disabled="item.disabled">
            <el-icon v-if="item.icon">
              <component :is="item.icon" />
            </el-icon>
            <template #title>
              <span>{{ item.title }}</span>
              <el-tag v-if="item.disabled" size="small" type="info" class="menu-tag">
                敬请期待
              </el-tag>
            </template>
          </el-menu-item>
        </template>
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
  flex-shrink: 0;
  border-radius: 8px;
  background: linear-gradient(
    135deg,
    var(--crm-color-primary) 0%,
    var(--crm-color-primary-hover) 100%
  );
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}

.logo-text {
  color: var(--crm-color-text);
  font-size: 16px;
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 0;
  overflow-x: hidden;
  overflow-y: auto;
}

.menu-tag {
  margin-left: 8px;
}

/* 保留 Element Plus 子菜单动画，缩短持续时间以减少连续布局开销。 */
.sidebar :deep(.el-collapse-transition-enter-active),
.sidebar :deep(.el-collapse-transition-leave-active) {
  transition-duration: 160ms;
}

.sidebar :deep(.el-sub-menu__icon-arrow) {
  transition: transform var(--crm-transition-fast);
}

/* 二级菜单文字与带图标的一级目录文字保持同一条起始线。 */
.sidebar:not(.is-collapsed) :deep(.el-sub-menu > .el-menu > .el-menu-item) {
  padding-left: calc(
    var(--el-menu-base-level-padding) + var(--el-menu-icon-width) + 5px
  ) !important;
}

.sidebar.is-collapsed {
  width: 64px;
}

:global(:root[data-theme='dark']) .sidebar {
  border-color: rgb(255 255 255 / 10%);
}
</style>
