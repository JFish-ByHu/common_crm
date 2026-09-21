import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import qiankun from 'vite-plugin-qiankun'
import { crmDevBackend } from '@common-crm/dev-tools'

export default defineConfig({
  plugins: [vue(), qiankun('system', { useDevMode: true }), crmDevBackend()],
  server: {
    host: '0.0.0.0',
    port: 8802,
    strictPort: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
})
