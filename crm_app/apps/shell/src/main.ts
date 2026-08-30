import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'
import { registerMicroApps, start } from 'qiankun'
import { microApps } from './micro-apps'
import { router } from './router'
import { useThemeStore } from './stores/theme'
import 'element-plus/dist/index.css'
import '../../../../packages/styles/base.css'

registerMicroApps(microApps, {
  beforeLoad: [
    async app => {
      console.info(`[qiankun] loading ${app.name}`)
    }
  ],
  afterMount: [
    async app => {
      console.info(`[qiankun] mounted ${app.name}`)
    }
  ]
})

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(ElementPlus)

useThemeStore(pinia).initialize()

router.isReady().then(() => {
  app.mount('#app')

  start({
    prefetch: false,
    sandbox: {
      experimentalStyleIsolation: true
    }
  })
})
