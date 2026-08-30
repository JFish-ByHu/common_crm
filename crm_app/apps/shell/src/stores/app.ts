import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    initialized: false
  }),
  actions: {
    markInitialized() {
      this.initialized = true
    }
  }
})
