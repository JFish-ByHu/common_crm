<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@common-crm/utils'
import { useAuthStore, useThemeStore } from '../stores'
import { HeaderBar, MainContent, Sidebar } from './components'
import { useLayoutNavigation } from './hooks'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const collapsed = ref(false)
const { menuItems, activeMenu, breadcrumbItems } = useLayoutNavigation()

const selectMenu = (path: string) => {
  router.push(path)
}

const logout = () => {
  authStore.logout()
  router.push('/login')
  Message.success('已退出登录')
}

const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}

const finishLayoutTransition = (event: TransitionEvent) => {
  if (event.propertyName === 'margin-left') {
    window.dispatchEvent(new Event('resize'))
  }
}
</script>

<template>
  <div class="admin-layout" :class="{ 'is-collapsed': collapsed }">
    <Sidebar
      :collapsed="collapsed"
      :active-menu="activeMenu"
      :items="menuItems"
      @select="selectMenu"
    />

    <div
      class="main-container"
      :class="{ 'is-collapsed': collapsed }"
      @transitionend="finishLayoutTransition"
    >
      <HeaderBar
        :breadcrumb-items="breadcrumbItems"
        :is-dark="themeStore.isDark"
        @logout="logout"
        @toggle-sidebar="toggleSidebar"
        @toggle-theme="themeStore.toggle()"
      />
      <MainContent />
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  width: 100%;
  min-width: 0;
  height: 100dvh;
  min-height: 100vh;
  overflow: hidden;
  background: var(--crm-color-bg);
}

.main-container {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  width: 0;
  min-width: 0;
  min-height: 0;
  margin-left: 240px;
  overflow: hidden;
  transition: margin-left var(--crm-transition-fast);
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
