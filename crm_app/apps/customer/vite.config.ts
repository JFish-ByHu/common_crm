import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import qiankun from 'vite-plugin-qiankun'
import { crmDevBackend, crmPages } from '@common-crm/dev-tools'

export default defineConfig({
  plugins: [crmPages(), vue(), qiankun('customer', { useDevMode: true }), crmDevBackend()],
  server: {
    host: '0.0.0.0',
    port: 8801,
    strictPort: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
})
