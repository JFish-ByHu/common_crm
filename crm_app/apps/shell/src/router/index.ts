import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/login/index.vue'
import MicroAppHost from '../views/MicroAppHost.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'micro-app-host',
      component: MicroAppHost
    }
  ]
})
