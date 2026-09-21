import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { crmDevBackend } from '@common-crm/dev-tools'

export default defineConfig({
  plugins: [vue(), crmDevBackend()],
  server: {
    host: '0.0.0.0',
    port: 8800,
    strictPort: true
  }
})
