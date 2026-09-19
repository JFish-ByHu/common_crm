import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/login/index.vue'
import Layout from '../layout/index.vue'
import DashboardView from '../views/dashboard/index.vue'
import { useAuthStore } from '../stores'

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
        {
          path: ':pathMatch(.*)*',
          component: () => import('../views/micro-app/index.vue'),
          meta: { requiresAuth: true }
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
