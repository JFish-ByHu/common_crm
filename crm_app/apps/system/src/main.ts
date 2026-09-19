import { createApp, type App as VueApp } from 'vue'
import ElementPlus from 'element-plus'
import { qiankunWindow, renderWithQiankun } from 'vite-plugin-qiankun/dist/helper'
import App from './App.vue'
import { clearMicroAppProps, setMicroAppProps } from './micro-app'
import { createSystemRouter } from './router'
import { initApiClient } from './services'
import type { MicroAppProps } from '@common-crm/types'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@common-crm/styles/base.css'
import '@common-crm/styles/progress.css'

let app: VueApp<Element> | undefined
let disposeRouter: (() => void) | undefined

function render(props: MicroAppProps = {}) {
  setMicroAppProps(props)
  initApiClient()

  const mountPoint = props.container?.querySelector('#app') ?? '#app'
  app = createApp(App)
  const { router, dispose } = createSystemRouter()
  disposeRouter = dispose
  app.use(router)
  app.use(ElementPlus)
  app.mount(mountPoint)
}

renderWithQiankun({
  bootstrap() {
    console.info('[system] bootstrap')
  },
  mount(props: MicroAppProps) {
    render(props)
  },
  unmount() {
    disposeRouter?.()
    disposeRouter = undefined
    app?.unmount()
    app = undefined
    clearMicroAppProps()
  },
  update(props: MicroAppProps) {
    setMicroAppProps(props)
  }
})

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
