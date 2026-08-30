import { defineStore } from 'pinia'

export const useCustomerAppStore = defineStore('customer-app', {
  state: () => ({
    initialized: false
  }),
  actions: {
    markInitialized() {
      this.initialized = true
    }
  }
})
