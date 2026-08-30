import { createApp, type App as VueApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/theme-chalk/dark/css-vars.css'
import { qiankunWindow, renderWithQiankun } from 'vite-plugin-qiankun/dist/helper'
import App from './App.vue'
import { createCustomerRouter } from './router'
import { setupTheme } from '../../../../packages/styles/theme'
import 'element-plus/dist/index.css'
import '../../../../packages/styles/base.css'

setupTheme()

let app: VueApp<Element> | undefined

function render(container?: Element) {
  const mountPoint = container?.querySelector('#app') ?? '#app'
  app = createApp(App)
  app.use(createPinia())
  app.use(createCustomerRouter())
  app.use(ElementPlus)
  app.mount(mountPoint)
}

renderWithQiankun({
  bootstrap() {
    console.info('[customer] bootstrap')
  },
  mount(props) {
    render(props.container)
  },
  unmount() {
    app?.unmount()
    app = undefined
  },
  update(props) {
    console.info('[customer] received updated props', props)
  }
})

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
