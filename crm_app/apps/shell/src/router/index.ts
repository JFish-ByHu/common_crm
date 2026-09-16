import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/login/index.vue'
import Layout from '../layout/index.vue'
import { useAuthStore } from '../stores'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/customer'
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
          path: ':pathMatch(.*)*',
          component: () => import('../views/MicroAppHost.vue'),
          meta: { requiresAuth: true }
        }
      ]
    }
  ]
})

// 全局路由守卫
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !authStore.isAuthenticated) {
    // 需要认证但未登录，跳转到登录页
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    // 已登录用户访问登录页，重定向到首页
    next('/customer')
  } else {
    next()
  }
})
