import { createApp, type App as VueApp } from 'vue'
import ElementPlus from 'element-plus'
import { qiankunWindow, renderWithQiankun } from 'vite-plugin-qiankun/dist/helper'
import App from './App.vue'
import { createSystemRouter } from './router'
import { initApiClient } from './services'
import type { SystemMicroAppProps } from './types'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@common-crm/styles/base.css'
import '@common-crm/styles/progress.css'

let app: VueApp<Element> | undefined

function render(props: SystemMicroAppProps = {}) {
  window.__SYSTEM_QIANKUN_PROPS__ = props
  initApiClient()

  const mountPoint = props.container?.querySelector('#app') ?? '#app'
  app = createApp(App)
  app.use(createSystemRouter())
  app.use(ElementPlus)
  app.mount(mountPoint)
}

renderWithQiankun({
  bootstrap() {
    console.info('[system] bootstrap')
  },
  mount(props: SystemMicroAppProps) {
    render(props)
  },
  unmount() {
    app?.unmount()
    app = undefined
    delete window.__SYSTEM_QIANKUN_PROPS__
  },
  update(props: SystemMicroAppProps) {
    window.__SYSTEM_QIANKUN_PROPS__ = props
  }
})

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
