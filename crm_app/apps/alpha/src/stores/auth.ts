import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const ACCESS_TOKEN_KEY = 'crm-access-token'
const REFRESH_TOKEN_KEY = 'crm-refresh-token'
const REMEMBERED_USERNAME_KEY = 'crm-remembered-username'
const REMEMBERED_PASSWORD_KEY = 'crm-remembered-password'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem(ACCESS_TOKEN_KEY))
  const refreshToken = ref<string | null>(localStorage.getItem(REFRESH_TOKEN_KEY))
  const rememberedUsername = ref<string | null>(localStorage.getItem(REMEMBERED_USERNAME_KEY))
  const rememberedPassword = ref<string | null>(localStorage.getItem(REMEMBERED_PASSWORD_KEY))

  const isAuthenticated = computed(() => !!accessToken.value)

  const setTokens = (access: string, refresh: string) => {
    accessToken.value = access
    refreshToken.value = refresh
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  }

  const clearTokens = () => {
    accessToken.value = null
    refreshToken.value = null
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }

  // 记住用户名和密码（注意：生产环境中应该加密存储或使用更安全的方式）
  const setRememberedCredentials = (username: string, password: string) => {
    rememberedUsername.value = username
    rememberedPassword.value = password
    localStorage.setItem(REMEMBERED_USERNAME_KEY, username)
    localStorage.setItem(REMEMBERED_PASSWORD_KEY, password)
  }

  const clearRememberedCredentials = () => {
    rememberedUsername.value = null
    rememberedPassword.value = null
    localStorage.removeItem(REMEMBERED_USERNAME_KEY)
    localStorage.removeItem(REMEMBERED_PASSWORD_KEY)
  }

  const logout = () => {
    clearTokens()
  }

  return {
    accessToken,
    refreshToken,
    rememberedUsername,
    rememberedPassword,
    isAuthenticated,
    setTokens,
    clearTokens,
    setRememberedCredentials,
    clearRememberedCredentials,
    logout
  }
})
