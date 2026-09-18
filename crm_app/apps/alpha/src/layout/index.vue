<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DataAnalysis, Setting, TrendCharts, User } from '@element-plus/icons-vue'
import { Message } from '../../../../../packages/utils'
import { useAuthStore, useThemeStore } from '../stores'
import HeaderBar, { type BreadcrumbItem } from './components/HeaderBar.vue'
import MainContent from './components/MainContent.vue'
import Sidebar, { type LayoutMenuItem } from './components/Sidebar.vue'

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
  if (path.startsWith('/system')) return '/system/users'
  return path
})

const menuItems: LayoutMenuItem[] = [
  { path: '/customer', title: '客户管理', icon: User },
  { path: '/sales', title: '销售管理', icon: TrendCharts, disabled: true },
  { path: '/reports', title: '数据报表', icon: DataAnalysis, disabled: true },
  { path: '/system/users', title: '系统管理', icon: Setting }
]

const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const path = route.path

  if (path.startsWith('/customer')) {
    return [{ title: '控制台', to: '/' }, { title: '客户管理' }]
  }

  if (path.startsWith('/sales')) {
    return [{ title: '控制台', to: '/' }, { title: '销售管理' }]
  }

  if (path.startsWith('/reports')) {
    return [{ title: '控制台', to: '/' }, { title: '数据报表' }]
  }

  if (path.startsWith('/system')) {
    return [{ title: '控制台', to: '/' }, { title: '系统管理' }, { title: '用户管理' }]
  }

  return [{ title: (route.meta.title as string) || '控制台' }]
})

const handleMenuSelect = (path: string) => {
  router.push(path)
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
  Message.success('已退出登录')
}
</script>

<template>
  <div class="admin-layout" :class="{ 'is-collapsed': collapsed }">
    <Sidebar :collapsed="collapsed" :active-menu="activeMenu" :items="menuItems" @select="handleMenuSelect" />

    <div class="main-container" :class="{ 'is-collapsed': collapsed }">
      <HeaderBar
        :breadcrumb-items="breadcrumbItems"
        :is-dark="themeStore.isDark"
        @logout="handleLogout"
        @toggle-sidebar="collapsed = !collapsed"
        @toggle-theme="themeStore.toggle()"
      />
      <MainContent />
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--crm-color-bg);
}

.main-container {
  display: flex;
  flex: 1;
  flex-direction: column;
  margin-left: 240px;
  transition: margin-left 0.28s ease;
}

.main-container.is-collapsed {
  margin-left: 64px;
}

@media (max-width: 768px) {
  .main-container {
    margin-left: 0;
  }
}
</style>
