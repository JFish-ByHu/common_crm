import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'crm-theme-mode'

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement

  root.dataset.theme = mode
  root.classList.toggle('dark', mode === 'dark')
}

function getInitialThemeMode(): ThemeMode {
  const storedMode = window.localStorage.getItem(THEME_STORAGE_KEY)

  if (storedMode === 'light' || storedMode === 'dark') {
    return storedMode
  }

  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode: getInitialThemeMode() as ThemeMode
  }),
  getters: {
    isDark: state => state.mode === 'dark'
  },
  actions: {
    initialize() {
      applyTheme(this.mode)
    },
    setMode(mode: ThemeMode) {
      this.mode = mode
      applyTheme(mode)
      window.localStorage.setItem(THEME_STORAGE_KEY, mode)
    },
    toggle() {
      this.setMode(this.isDark ? 'light' : 'dark')
    }
  }
})
