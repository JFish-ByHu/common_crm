# @common-crm/api

统一的 API 客户端封装，基于 axios，提供类型安全的接口调用。

响应结构与后端 `Result` 保持一致：`{ code, data, msg }`。后端业务失败可能仍返回 HTTP 200，客户端会根据响应体中的 `code >= 400` 转换为 `ApiError`。

## 特性

- 自动注入最新 Bearer token，保留请求显式设置的 Authorization。
- 区分业务错误、HTTP 错误、超时、网络错误及响应协议错误，保留原始 cause。
- 登录请求跳过全局 401 处理；同一会话的并发 401 只处理一次，旧会话响应不会清除新会话。
- `request<T>()` 返回 `ApiResponse<T>`；`requestRaw<T>()` 和 Axios 实例保留完整响应。
- 保留 Axios 请求取消语义，通过 `isRequestCanceled(error)` 判断。
- 默认显示 NProgress 顶部进度条，所有启用进度条的并发请求结束后统一收起。

后端提供登录、refresh token 轮换、当前用户、退出登录和修改密码接口。本包暂不自动刷新或重试请求，业务可按需要调用 `refreshTokens()`；403 表示无权限，不会触发退出登录。

## 安装

```bash
pnpm add @common-crm/api @common-crm/styles
```

## 使用方法

### 1. 初始化请求客户端

在应用入口（如 `main.ts`）初始化：

```typescript
import { createPinia } from 'pinia'
import { initApiClient } from './services'
import { router } from './router'
import '@common-crm/styles/progress.css'

const pinia = createPinia()
app.use(pinia)
initApiClient(pinia, router)
app.use(router)
```

`services/api.ts` 中的配置：

```typescript
import { initRequest } from '@common-crm/api'
import type { Pinia } from 'pinia'
import type { Router } from 'vue-router'
import { useAuthStore } from '../stores'

export function initApiClient(pinia: Pinia, router: Router) {
  const authStore = useAuthStore(pinia)
  initRequest({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
    timeout: 10000,
    withCredentials: true,
    getAccessToken: () => authStore.accessToken,
    onUnauthorized: async () => {
      const currentRoute = router.currentRoute.value
      authStore.clearTokens()
      if (currentRoute.path !== '/login') {
        await router.replace({ path: '/login', query: { redirect: currentRoute.fullPath } })
      }
    }
  })
}

// 导出所有 API 方法
export * from '@common-crm/api'
```

### 2. 在组件中使用

```vue
<script setup lang="ts">
import { changePassword, getCurrentUser, login, logout, refreshTokens } from '@/services'
import { useAuthStore } from '@/stores'
import { ref } from 'vue'

const authStore = useAuthStore()
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

    if (!res.data) {
      throw new Error(res.msg)
    }

    // 保存 token
    authStore.setTokens(res.data.accessToken, res.data.refreshToken)

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
import { request } from '@common-crm/api'

// 示例：后端提供对应业务接口后，在 modules 中声明。
interface Customer {
  customerId: string
  name: string
}

export function getCustomerById(id: string) {
  return request<Customer>({ url: `/customer/${id}`, method: 'get' })
}
```

## API 列表

### Auth 模块 (`auth.ts`)

```typescript
import { login } from '@/services'

// 登录
const res = await login({ username, password })

// 轮换 access token 和 refresh token，旧 refresh token 随即失效
const refreshed = await refreshTokens({ refreshToken })

// 当前用户
const currentUser = await getCurrentUser()

// 撤销当前 refresh session
await logout({ refreshToken })

// 修改密码后撤销该用户的所有会话
await changePassword({ currentPassword, newPassword })
```

### Users 模块 (`users.ts`)

从 `@common-crm/api` 或应用的 `services` 统一入口导入：

| 方法                      | 接口                               | 用途                           |
| ------------------------- | ---------------------------------- | ------------------------------ |
| `queryUserList`           | `GET /users/list`                  | 关键词、账号状态筛选及可选分页 |
| `queryUserSelectList`     | `GET /users/selectList`            | 按用户名搜索下拉选项及可选分页 |
| `createUser`              | `POST /users/create`               | 创建用户                       |
| `updateUser`              | `PATCH /users/update`              | 编辑用户名、邮箱、密码         |
| `updateUserAccountStatus` | `PATCH /users/updateAccountStatus` | 启用或停用账号                 |
| `deleteUser`              | `DELETE /users/delete`             | 单个删除                       |
| `batchDeleteUsers`        | `DELETE /users/batchDelete`        | 批量删除                       |

```typescript
import { queryUserList, queryUserSelectList, updateUser, batchDeleteUsers } from '@common-crm/api'

const result = await queryUserList({ keyword: '张', accountStatus: 1, page: 1, pageSize: 20 })
const options = await queryUserSelectList({ username: '张' })
await updateUser({ userId, username: '新用户名', email: null })
await batchDeleteUsers({ userIds: selectedIds })
```

列表结果均为 `{ list, total, page, pageSize }`。未传 `page` 和 `pageSize` 时查询全部匹配项，响应分页字段为 `null`；任一分页参数传入时，缺省值为 `page=1`、`pageSize=20`。`accountStatus` 为 `1`（正常）或 `0`（停用）。下拉项仅包含 `userId`、`username`、`accountStatus`。

用户列表、创建、编辑及状态更新响应中的 `createTime`、`updateTime` 已由后端按中国标准时间格式化为 `yyyy-MM-dd HH:mm:ss`，前端可直接展示。

两个查询方法的第二个参数支持 `{ signal, showProgress }`，便于取消过期请求。写操作的 ID 和其他参数均放在 JSON 请求体。编辑时省略 `password` 保留原密码，`email: null` 清空邮箱；重设密码、停用和删除用户都会撤销对应的登录会话。

## 配置说明

### ApiClientConfig

```typescript
interface ApiClientConfig {
  baseURL: string // API 基础 URL
  timeout?: number // 默认 10000ms，0 表示不限制超时
  withCredentials?: boolean // 是否携带 Cookie（默认 true）
  showProgress?: boolean // 是否显示 NProgress 进度条（默认 true）
  getAccessToken?: () => string | null // 获取 token 的函数
  onUnauthorized?: () => void | Promise<void> // 全局会话失效处理
}
```

请求配置继承 Axios 配置，支持 `signal`、`params`、`headers` 等，并增加 `requiresAuth?: boolean`。默认启用鉴权，公开接口设为 `false` 时跳过自动 token 注入和全局 401 回调。内置 `login()` 已设置此选项。

会话去重依据 `getAccessToken()` 返回的 token；应用应在失效回调中清理登录状态。回调失败不会覆盖原始请求错误。

### 请求进度条

应用入口引入一次 `@common-crm/styles/progress.css`。进度条沿用 Element Plus 主题色，不显示旋转图标；无 DOM 的环境不会启动进度条。业务失败、网络错误、超时或请求取消都会结束对应请求的进度计数。

客户端和单个请求都支持 `showProgress`，请求配置优先。例如轮询时关闭：

```typescript
await request({ url: '/notifications', showProgress: false })
```

### 原始响应和文件下载

```typescript
import { requestRaw } from '@common-crm/api'

const response = await requestRaw<Blob>({ url: '/customer/export', responseType: 'blob' })
const file = response.data
const contentType = response.headers['content-type']
```

`request<T>()` 中的 `T` 表示业务 `data`，不要再次写成 `ApiResponse<T>`。业务请求会检查 `{ code, data, msg }` 外层结构；原始响应入口不要求该结构。`getAxiosInstance()` 和 `initRequest()` 返回的实例现在保留 `AxiosResponse`，访问业务响应时使用 `response.data`。

## 错误处理

请求失败时抛出 `ApiError`；主动取消保留 Axios 的取消错误，通常无需向用户提示：

```typescript
import { login, ApiError, isRequestCanceled } from '@/services'

try {
  await login({ username, password })
} catch (error) {
  if (isRequestCanceled(error)) {
    // 主动取消，无需提示。
  } else if (error instanceof ApiError) {
    console.log(error.kind) // business / http / timeout / network / protocol / unknown
    console.log(error.code) // 业务错误码
    console.log(error.status) // HTTP 状态码
    console.log(error.message) // 错误消息
    console.log(error.response) // 原始响应数据
    console.log(error.cause) // 原始错误（如 AxiosError）
  }
}
```

## 扩展新模块

### 1. 创建模块文件

在 `packages/api/src/modules/` 中创建新的模块文件（如 `customer.ts`）。下面是扩展示例，需要后端实现对应接口：

```typescript
import type { ApiResponse, PageRequest, PageResponse } from '../types'
import { request } from '../core'

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
    params
  })
}

/**
 * 获取客户详情
 */
export function getCustomerById(id: string): Promise<ApiResponse<Customer>> {
  return request({
    url: `/customer/${id}`,
    method: 'get'
  })
}

/**
 * 创建客户
 */
export function createCustomer(data: Partial<Customer>): Promise<ApiResponse<Customer>> {
  return request({
    url: '/customer',
    method: 'post',
    data
  })
}

/**
 * 更新客户
 */
export function updateCustomer(
  id: string,
  data: Partial<Customer>
): Promise<ApiResponse<Customer>> {
  return request({
    url: `/customer/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除客户
 */
export function deleteCustomer(id: string): Promise<ApiResponse<void>> {
  return request({
    url: `/customer/${id}`,
    method: 'delete'
  })
}
```

### 2. 在 index.ts 中导出

```typescript
// packages/api/src/modules/index.ts
export * from './auth'
export * from './customer' // 新增
```

### 3. 在应用中使用

```typescript
import { getCustomerList, createCustomer } from '@/services'

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
import { login } from '@/services'
await login({ username, password })
```

✅ 更简洁清晰  
✅ 按需导入，Tree-shaking 友好  
✅ IDE 自动补全更好  
✅ 更容易 mock 和测试

## 验证

```powershell
pnpm --filter @common-crm/api test
pnpm --filter @common-crm/api type-check
```
