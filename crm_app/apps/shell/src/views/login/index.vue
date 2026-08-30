<script setup lang="ts">
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { reactive, ref } from 'vue'

const formRef = ref<FormInstance>()
const submitting = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules: FormRules<typeof form> = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function submitLogin() {
  const isFormValid = await formRef.value?.validate().catch(() => false)

  if (!isFormValid) {
    return
  }

  submitting.value = true

  window.setTimeout(() => {
    submitting.value = false
    ElMessage.success('登录校验通过，认证接口接入后即可登录')
  }, 450)
}
</script>

<template>
  <main class="login-page">
    <section class="login-visual" aria-label="CRM 平台介绍">
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
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            autocomplete="username"
            placeholder="请输入用户名"
            size="large"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            autocomplete="current-password"
            placeholder="请输入密码"
            show-password
            size="large"
            type="password"
          />
        </el-form-item>

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
  background-color: #edf6ff;
  background-image: url('../../assets/images/login_bg.svg');
  background-position: center;
  background-size: cover;
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
  background: #fff;
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
  margin-bottom: 22px;
}

:deep(.el-form-item__label) {
  padding-bottom: 8px;
  color: var(--crm-color-text);
  font-size: 14px;
  font-weight: 500;
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
}
</style>
