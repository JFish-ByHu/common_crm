<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Message, notifyRequestError } from '@common-crm/utils'
import { useAuthStore, useThemeStore } from '../stores'
import { logout as revokeSession } from '../services'
import { HeaderBar, MainContent, Sidebar } from './components'
import { useLayoutNavigation, usePresenceHeartbeat } from './hooks'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const collapsed = ref(false)
const { menuItems, activeMenu, breadcrumbItems } = useLayoutNavigation()
const { pauseHeartbeat, resumeHeartbeat } = usePresenceHeartbeat()
const loggingOut = ref(false)

const selectMenu = (path: string) => {
  router.push(path)
}

const logout = async () => {
  if (loggingOut.value) return
  loggingOut.value = true
  pauseHeartbeat()
  const refreshToken = authStore.refreshToken
  try {
    if (refreshToken) await revokeSession({ refreshToken })
    if (authStore.refreshToken !== refreshToken) {
      resumeHeartbeat()
      return
    }
    authStore.logout()
    await router.push('/login')
    Message.success('已退出登录')
  } catch (error) {
    resumeHeartbeat()
    notifyRequestError(error, { title: '退出失败', message: '退出登录失败，请稍后重试' })
  } finally {
    loggingOut.value = false
  }
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
