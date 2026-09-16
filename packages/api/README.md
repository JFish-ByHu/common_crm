# @common-crm/api

统一的 API 客户端封装，基于 axios，提供类型安全的接口调用。

## 特性

- ✅ **自动 Token 注入** - 请求拦截器自动添加 Bearer token
- ✅ **统一错误处理** - 响应拦截器处理 401/403/网络错误
- ✅ **Token 自动刷新** - Token 过期时自动刷新并重试
- ✅ **TypeScript 类型安全** - 完整的类型定义
- ✅ **函数式 API** - 每个接口独立导出，清晰易用

## 安装

```bash
pnpm add @common-crm/api
```

## 使用方法

### 1. 初始化请求客户端

在应用入口（如 `main.ts`）初始化：

```typescript
import { initApiClient } from './services/api'

// 初始化 API 客户端
initApiClient()
```

`services/api.ts` 中的配置：

```typescript
import { initRequest } from '@common-crm/api'
import { router } from '../router'

export function initApiClient() {
  initRequest({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
    timeout: 10000,
    withCredentials: true,
    getAccessToken: () => localStorage.getItem('accessToken'),
    onUnauthorized: () => {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      router.push('/login')
    },
    onTokenExpired: () => {
      // 处理 token 过期逻辑
    },
  })
}

// 导出所有 API 方法
export * from '@common-crm/api'
```

### 2. 在组件中使用

```vue
<script setup lang="ts">
import { login } from '@/services/api'
import { ref } from 'vue'

const username = ref('')
const password = ref('')
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  try {
    const res = await login({
      username: username.value,
      password: password.value
    })
    
    // 保存 token
    localStorage.setItem('accessToken', res.data.accessToken)
    localStorage.setItem('refreshToken', res.data.refreshToken)
    
    console.log('登录成功', res)
  } catch (error) {
    console.error('登录失败', error)
  } finally {
    loading.value = false
  }
}
</script>
```

### 3. 在非组件中使用

```typescript
import { getCurrentUser } from '@common-crm/api'

export async function fetchUserData() {
  const res = await getCurrentUser()
  return res.data
}
```

## API 列表

### Auth 模块 (`auth.ts`)

```typescript
import { login, register, logout, getCurrentUser, changePassword, refreshToken } from '@/services/api'

// 登录
const res = await login({ username, password })

// 注册
await register({ username, password, email })

// 刷新 Token
await refreshToken({ refreshToken })

// 登出
await logout()

// 获取当前用户信息
const userInfo = await getCurrentUser()

// 修改密码
await changePassword({ oldPassword, newPassword })
```

## 配置说明

### ApiClientConfig

```typescript
interface ApiClientConfig {
  baseURL: string                    // API 基础 URL
  timeout?: number                   // 请求超时时间（默认 10000ms）
  withCredentials?: boolean          // 是否携带 Cookie（默认 true）
  getAccessToken?: () => string | null  // 获取 token 的函数
  onUnauthorized?: () => void        // 401 未授权回调
  onTokenExpired?: () => void        // Token 过期回调
}
```

## 错误处理

所有 API 调用失败时会抛出 `ApiError`：

```typescript
import { login, ApiError } from '@/services/api'

try {
  await login({ username, password })
} catch (error) {
  if (error instanceof ApiError) {
    console.log(error.code)      // 业务错误码
    console.log(error.status)    // HTTP 状态码
    console.log(error.message)   // 错误消息
    console.log(error.response)  // 原始响应数据
  }
}
```

## 扩展新模块

### 1. 创建模块文件

在 `packages/api/src/` 中创建新的模块文件（如 `customer.ts`）：

```typescript
import type { ApiResponse, PageRequest, PageResponse } from './types'
import { request } from './request'

/**
 * 客户信息
 */
export interface Customer {
  customerId: string
  name: string
  email: string
  phone?: string
}

/**
 * 获取客户列表
 */
export function getCustomerList(params: PageRequest): Promise<ApiResponse<PageResponse<Customer>>> {
  return request({
    url: '/customer',
    method: 'get',
    params,
  })
}

/**
 * 获取客户详情
 */
export function getCustomerById(id: string): Promise<ApiResponse<Customer>> {
  return request({
    url: `/customer/${id}`,
    method: 'get',
  })
}

/**
 * 创建客户
 */
export function createCustomer(data: Partial<Customer>): Promise<ApiResponse<Customer>> {
  return request({
    url: '/customer',
    method: 'post',
    data,
  })
}

/**
 * 更新客户
 */
export function updateCustomer(id: string, data: Partial<Customer>): Promise<ApiResponse<Customer>> {
  return request({
    url: `/customer/${id}`,
    method: 'put',
    data,
  })
}

/**
 * 删除客户
 */
export function deleteCustomer(id: string): Promise<ApiResponse<void>> {
  return request({
    url: `/customer/${id}`,
    method: 'delete',
  })
}
```

### 2. 在 index.ts 中导出

```typescript
// packages/api/src/index.ts
export * from './types'
export * from './auth'
export * from './customer'  // 新增
export * from './request'
```

### 3. 在应用中使用

```typescript
import { getCustomerList, createCustomer } from '@/services/api'

// 获取客户列表
const res = await getCustomerList({ page: 1, pageSize: 10 })

// 创建客户
await createCustomer({ name: '张三', email: 'zhangsan@example.com' })
```

## 环境变量

```bash
# .env.development
VITE_API_BASE_URL=/api
```

## 优势对比

**旧方式（对象方法）：**
```typescript
const api = useApi()
await api.auth.login({ username, password })
```

**新方式（函数式）：**
```typescript
import { login } from '@/services/api'
await login({ username, password })
```

✅ 更简洁清晰  
✅ 按需导入，Tree-shaking 友好  
✅ IDE 自动补全更好  
✅ 更容易 mock 和测试

