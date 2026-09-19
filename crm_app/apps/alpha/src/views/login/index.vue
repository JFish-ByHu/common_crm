<script setup lang="ts">
import { type FormInstance, type FormRules } from 'element-plus'
import { Moon, Sunny } from '@element-plus/icons-vue'
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '../../../../../../packages/utils'
import { useThemeStore, useAuthStore } from '../../stores'
import { login, ApiError } from '../../services'
import LoginAnimation from './components/LoginAnimation.vue'

const router = useRouter()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const rememberPassword = ref(false)
const themeStore = useThemeStore()
const authStore = useAuthStore()

const form = reactive({
  username: '',
  password: ''
})

const rules: FormRules<typeof form> = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

onMounted(() => {
  // 加载记住的用户名和密码
  if (authStore.rememberedUsername) {
    form.username = authStore.rememberedUsername
    rememberPassword.value = true
  }
  if (authStore.rememberedPassword) {
    form.password = authStore.rememberedPassword
  }
})

const submitLogin = async () => {
  const isFormValid = await formRef.value?.validate().catch(() => false)

  if (!isFormValid) {
    return
  }

  submitting.value = true

  try {
    // 调用登录接口
    const res = await login({
      username: form.username,
      password: form.password
    })

    if (!res.data) {
      Message.error(res.msg || '登录响应无效')
      return
    }

    // 使用 Pinia store 保存 token
    authStore.setTokens(res.data.accessToken, res.data.refreshToken)

    // 是否记住用户名和密码
    if (rememberPassword.value) {
      authStore.setRememberedCredentials(form.username, form.password)
    } else {
      authStore.clearRememberedCredentials()
    }

    Message.success('登录成功')

    // 跳转到重定向地址或控制台
    const redirect = router.currentRoute.value.query.redirect as string
    router.push(redirect || '/dashboard')
  } catch (error) {
    if (error instanceof ApiError) {
      Message.error(error.message || '登录失败')
    } else {
      Message.error('网络错误，请稍后重试')
    }
    console.error('登录失败:', error)
  } finally {
    submitting.value = false
  }
}

const forgotPassword = () => {
  Message.info('请联系管理员重置密码')
}

const toggleThemeMode = () => {
  themeStore.toggle()
}
</script>

<template>
  <main class="login-page">
    <el-button
      class="theme-toggle"
      :aria-label="themeStore.isDark ? '切换到亮色模式' : '切换到暗色模式'"
      type="primary"
      @click="toggleThemeMode"
    >
      <el-icon>
        <Sunny v-if="themeStore.isDark" />
        <Moon v-else />
      </el-icon>
    </el-button>

    <section class="login-visual" aria-label="CRM 平台介绍">
      <LoginAnimation background-color="var(--crm-color-primary)" />
      <div class="visual-copy">
        <p class="visual-kicker">COMMON CRM</p>
        <h1>让客户关系管理更简单</h1>
        <p>统一管理客户、业务与团队协作，专注每一次有效沟通。</p>
      </div>
    </section>

    <section class="login-panel" aria-labelledby="login-title">
      <header class="login-header">
        <p class="product-name">COMMON CRM</p>
        <h2 id="login-title">欢迎登录</h2>
        <p>内部业务管理平台</p>
      </header>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="submitLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            aria-label="用户名"
            autocomplete="username"
            placeholder="请输入用户名"
            size="large"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            aria-label="密码"
            autocomplete="current-password"
            placeholder="请输入密码"
            show-password
            size="large"
            type="password"
          />
        </el-form-item>

        <div class="form-options">
          <el-checkbox v-model="rememberPassword">记住密码</el-checkbox>
          <el-button link type="primary" @click="forgotPassword">忘记密码</el-button>
        </div>

        <el-button
          class="submit-button"
          :loading="submitting"
          native-type="submit"
          size="large"
          type="primary"
        >
          登录
        </el-button>
      </el-form>

      <p class="login-hint">仅限已授权的内部成员访问</p>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  min-height: 100dvh;
  background: var(--crm-color-bg);
}

.login-visual {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  min-height: 100dvh;
  padding: clamp(32px, 6vw, 72px);
  overflow: hidden;
  background: #edf6ff;
}

.login-visual::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgb(4 59 74 / 30%),
    rgb(4 59 74 / 8%) 58%,
    rgb(4 59 74 / 18%)
  );
  content: '';
  pointer-events: none;
}

.theme-toggle {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 10;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--crm-color-border);
  border-radius: 50%;
  color: var(--crm-color-primary);
  background: var(--el-bg-color, #fff);
  box-shadow: none;
}

.theme-toggle :deep(.el-icon) {
  display: inline-flex;
  font-size: 18px;
}

.visual-copy {
  position: relative;
  z-index: 1;
  max-width: 420px;
  color: #fff;
  text-shadow: 0 1px 2px rgb(0 45 61 / 20%);
}

.visual-kicker,
.product-name {
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.visual-kicker {
  margin-bottom: 16px;
}

.product-name {
  color: var(--crm-color-primary);
}

.visual-copy h1 {
  margin-bottom: 12px;
  font-size: clamp(28px, 3vw, 42px);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.03em;
}

.visual-copy p:last-child {
  max-width: 360px;
  color: rgb(255 255 255 / 86%);
  font-size: 15px;
  line-height: 1.7;
}

.login-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px clamp(24px, 6vw, 96px);
  background: var(--el-bg-color, #fff);
}

.login-panel > * {
  width: min(100%, 400px);
}

.login-header {
  margin-bottom: 28px;
}

.product-name {
  margin-bottom: 20px;
}

.login-header h2 {
  margin-bottom: 8px;
  color: var(--crm-color-text);
  font-size: 28px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.02em;
}

.login-header p:last-child,
.login-hint {
  color: var(--crm-color-text-muted);
  font-size: 14px;
}

:deep(.el-form-item) {
  margin-bottom: 24px;
}

.submit-button {
  width: 100%;
  min-height: 44px;
  margin-top: 4px;
  border-radius: var(--crm-radius-md);
  font-weight: 500;
}

:deep(.el-button--primary) {
  border-color: var(--crm-color-primary);
  background: var(--crm-color-primary);
}

:deep(.el-button--primary:hover),
:deep(.el-button--primary:focus-visible) {
  border-color: var(--crm-color-primary-hover);
  background: var(--crm-color-primary-hover);
}

.theme-toggle.el-button.el-button--primary {
  border-color: var(--crm-color-border);
  color: var(--crm-color-primary);
  background: var(--el-bg-color, #fff);
}

.theme-toggle.el-button.el-button--primary:hover,
.theme-toggle.el-button.el-button--primary:focus-visible {
  border-color: var(--crm-color-primary);
  color: var(--crm-color-primary);
  background: var(--crm-color-primary-soft);
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.form-options :deep(.el-checkbox) {
  margin-right: 0;
}

.form-options :deep(.el-button) {
  min-height: 32px;
  padding: 4px 0;
  font-size: 14px;
}

.login-hint {
  margin-top: 20px;
  text-align: center;
}

@media (max-width: 768px) {
  .login-page {
    display: block;
  }

  .login-visual {
    min-height: 220px;
    padding: 32px 24px;
    background-position: center 38%;
  }

  .visual-copy h1 {
    font-size: 28px;
  }

  .visual-copy p:last-child {
    display: none;
  }

  .login-panel {
    min-height: calc(100dvh - 220px);
    padding: 24px 16px 40px;
  }

  .theme-toggle {
    top: 16px;
    right: 16px;
  }
}
</style>
