import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/login/index.vue'
import Layout from '../layout/index.vue'
import DashboardView from '../views/dashboard/index.vue'
import MicroAppView from '../views/micro-app/index.vue'
import { useAuthStore } from '../stores'
import { microAppModules } from '../micro-apps'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: Layout,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView,
          meta: { requiresAuth: true, title: '控制台' }
        },
        ...microAppModules.map(({ manifest }) => ({
          path: `${manifest.basePath.slice(1)}/:pathMatch(.*)*`,
          name: `micro-app-${manifest.name}`,
          component: MicroAppView,
          meta: { requiresAuth: true, title: manifest.title, microApp: manifest.name }
        })),
        {
          path: ':pathMatch(.*)*',
          redirect: '/dashboard'
        }
      ]
    }
  ]
})

// 全局路由守卫
router.beforeEach(to => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !authStore.isAuthenticated) {
    // 需要认证但未登录，跳转到登录页
    return {
      path: '/login',
      query: { redirect: to.fullPath }
    }
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    // 已登录用户访问登录页，重定向到首页
    return '/dashboard'
  }
})
