import { createRouter, createWebHistory } from 'vue-router'
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
import App from '../App.vue'

export function createCustomerRouter() {
  return createRouter({
    history: createWebHistory(qiankunWindow.__POWERED_BY_QIANKUN__ ? '/customer' : '/'),
    routes: [
      {
        path: '/:pathMatch(.*)*',
        name: 'customer-root',
        component: App
      }
    ]
  })
}
