import { createApp, type App as VueApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/theme-chalk/dark/css-vars.css'
import { qiankunWindow, renderWithQiankun } from 'vite-plugin-qiankun/dist/helper'
import App from './App.vue'
import { createCustomerRouter } from './router'
import 'element-plus/dist/index.css'
import '@common-crm/styles/base.css'
import '@common-crm/styles/progress.css'

let app: VueApp<Element> | undefined

function render(props: any = {}) {
  const container = props.container
  const mountPoint = container?.querySelector('#app') ?? '#app'

  app = createApp(App)
  app.use(createPinia())
  app.use(createCustomerRouter())
  app.use(ElementPlus)

  // 将主应用传递的 props 挂载到全局，供子应用使用
  if (qiankunWindow.__POWERED_BY_QIANKUN__) {
    app.provide('qiankunProps', props)
    // 同时挂载到 window，方便路由守卫等非组件场景使用
    ;(window as any).__QIANKUN_PROPS__ = props
  }

  app.mount(mountPoint)
}

renderWithQiankun({
  bootstrap() {
    console.info('[customer] bootstrap')
  },
  mount(props) {
    console.info('[customer] mount with props:', props)
    render(props)
  },
  unmount() {
    app?.unmount()
    app = undefined
    // 清理全局 props
    delete (window as any).__QIANKUN_PROPS__
  },
  update(props) {
    console.info('[customer] received updated props', props)
    // 更新全局 props
    ;(window as any).__QIANKUN_PROPS__ = props
  }
})

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
