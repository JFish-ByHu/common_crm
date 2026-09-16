<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Menu as IconMenu,
  User,
  Setting,
  Moon,
  Sunny,
  Bell,
  Search,
  TrendCharts,
  DataAnalysis
} from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import { Message } from '../../../../../packages/utils'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const collapsed = ref(false)
const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/customer')) return '/customer'
  if (path.startsWith('/sales')) return '/sales'
  if (path.startsWith('/reports')) return '/reports'
  return path
})

// 菜单配置
const menuItems = [
  {
    path: '/customer',
    title: '客户管理',
    icon: User
  },
  {
    path: '/sales',
    title: '销售管理',
    icon: TrendCharts,
    disabled: true
  },
  {
    path: '/reports',
    title: '数据报表',
    icon: DataAnalysis,
    disabled: true
  }
]

const handleMenuSelect = (path: string) => {
  router.push(path)
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
  Message.success('已退出登录')
}

const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}

const toggleTheme = () => {
  themeStore.toggle()
}
</script>

<template>
  <div class="admin-layout" :class="{ 'is-collapsed': collapsed }">
    <!-- 侧边栏 -->
    <aside class="sidebar">
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
          @select="handleMenuSelect"
        >
          <el-menu-item
            v-for="item in menuItems"
            :key="item.path"
            :index="item.path"
            :disabled="item.disabled"
          >
            <el-icon>
              <component :is="item.icon" />
            </el-icon>
            <template #title>
              <span>{{ item.title }}</span>
              <el-tag v-if="item.disabled" size="small" type="info" class="menu-tag"
                >敬请期待</el-tag
              >
            </template>
          </el-menu-item>
        </el-menu>
      </nav>
    </aside>

    <!-- 主内容区 -->
    <div class="main-container">
      <!-- 顶部导航栏 -->
      <header class="header">
        <div class="header-left">
          <el-button text class="header-action" @click="toggleSidebar">
            <el-icon><IconMenu /></el-icon>
          </el-button>
          <div class="breadcrumb">
            <span class="breadcrumb-item">{{ route.meta.title || '控制台' }}</span>
          </div>
        </div>

        <div class="header-right">
          <el-button text class="header-action" title="搜索">
            <el-icon><Search /></el-icon>
          </el-button>
          <el-button text class="header-action" title="通知">
            <el-icon><Bell /></el-icon>
          </el-button>
          <el-button
            text
            class="header-action"
            :title="themeStore.isDark ? '切换到亮色模式' : '切换到暗色模式'"
            @click="toggleTheme"
          >
            <el-icon>
              <Sunny v-if="themeStore.isDark" />
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
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-icon><Setting /></el-icon>
                  系统设置
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout"> 退出登录 </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 内容区域 -->
      <main class="content">
        <div id="micro-app-container" class="micro-app-wrapper"></div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--crm-color-bg);
}

/* ===== 侧边栏 ===== */
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

.is-collapsed .sidebar {
  width: 64px;
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
  font-size: 16px;
  color: var(--crm-color-text);
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
  margin: 4px 12px;
  border-radius: 8px;
  height: 48px;
  line-height: 48px;
}

.is-collapsed .sidebar-nav :deep(.el-menu-item) {
  margin: 4px 8px;
  padding: 0 !important;
  display: flex;
  justify-content: center;
  align-items: center;
}

.is-collapsed .sidebar-nav :deep(.el-menu-item .el-icon) {
  margin-right: 0 !important;
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

/* ===== 主容器 ===== */
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 240px;
  transition: margin-left 0.28s ease;
}

.is-collapsed .main-container {
  margin-left: 64px;
}

/* ===== 顶部栏 ===== */
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
  font-size: 18px;
  color: var(--crm-color-text-muted);
}

.header-action:hover {
  color: var(--crm-color-primary);
  background: var(--crm-color-surface-muted);
}

.breadcrumb {
  margin-left: 8px;
  font-size: 16px;
  font-weight: 500;
  color: var(--crm-color-text);
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
  background: var(--crm-color-primary-soft);
  color: var(--crm-color-primary);
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--crm-color-text);
}

/* ===== 内容区 ===== */
.content {
  flex: 1;
  overflow: auto;
}

.micro-app-wrapper {
  min-height: 100%;
  background: var(--crm-color-surface);
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar.is-mobile-open {
    transform: translateX(0);
  }

  .main-container {
    margin-left: 0;
  }

  .header {
    padding: 0 16px;
  }

  .content {
    padding: 16px;
  }

  .user-name {
    display: none;
  }
}

/* ===== 暗色主题适配 ===== */
:root[data-theme='dark'] .sidebar,
:root[data-theme='dark'] .header {
  border-color: rgba(255, 255, 255, 0.1);
}

:root[data-theme='dark'] .micro-app-wrapper {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}
</style>
