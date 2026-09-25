# 前端开发工具

## definePage 页面注册

三个应用的 Vite 配置使用 `crmPages()`，放在 `vue()` 前；应用 `src/page-macros.d.ts` 引用 `@common-crm/dev-tools/client` 提供宏与虚拟模块类型。

业务页面在 `<script setup lang="ts">` 顶层声明一次，无需导入宏：

```vue
<script setup lang="ts">
definePage({
  key: 'system-user-detail',
  title: '用户详情',
  defaultPath: '/system/users/:userId',
  visible: false
})
</script>
```

- 可以放在 `src/views/users/detail.vue`，也可以是 `index.vue`、`edit.vue`；文件名不决定路由。
- 插件扫描 `crm_app/apps/*/src/views/**/*.vue`，只收录声明了宏的文件，排除 `components`、`hooks`、`tests`、`__tests__` 等内部目录。不声明宏的抽屉、表单继续作为普通组件。
- `key` 是稳定组件标识，使用应用名前缀，例如 `system-users`。移动文件时保留 key，既有数据库绑定仍有效；改 key 后需要调整绑定。
- `title`、`defaultPath`、`visible` 仅是创建菜单时的默认值，数据库仍管理最终菜单名称、层级、路径、图标、启用、显示及权限标识。
- 默认 `visible: true`；带 `/:param` 的页面必须显式 `visible: false`。只支持必填命名参数，不支持可选参数、通配符或自定义正则。参数命名不得重复。
- 注册页面后，在菜单管理中选中该组件、保存菜单并给角色授权。隐藏页面同样需要明确授权，不隐式继承其他页面或按钮权限。
- 参数必须是静态对象字面量；禁止变量引用、表达式、展开属性、计算属性和重复声明。插件通过 Vue SFC 与 TypeScript AST 读取数据，不执行页面代码。
- 重复 key、重复或参数结构相同的默认路径、越过所属应用的路径、使用保留路径都会报出文件位置并阻止构建。
- `virtual:crm-pages/catalog` 提供所有子应用的纯元信息，用于菜单组件选择；`virtual:crm-pages/components` 仅生成当前子应用的动态 import，不把其他应用页面打入本应用。
- 开发模式监听新增、修改、删除；声明或文件位置变化会刷新页面以重建清单和路由，普通页面内容修改仍走 Vue HMR。完整扫描根是 `crm_app/apps`，构建时需包含所有子应用源码才能生成完整菜单选项。
- 生产新增页面需要重新构建并部署所属应用及使用清单的 System；运行时不会从服务器任意文件路径加载代码。部署一致版本后再配置新菜单。
- 组件删除后，编辑菜单显示“组件不存在”并要求重选；已授权访问显示明确的不可用页面，不自动删除数据库菜单及角色授权。
- 宏在 Vue 编译前移除并生成 source map，运行时不存在 `definePage` 调用。现有四个页面沿用原 key，无需数据库迁移。

这份声明不包含权限码，不替代后端授权；按钮仍通过 `hasPermission(permissionCode)` 或表格操作的 `permission` 判断。

## 开发后端就绪检测

Alpha、Customer、System 的 Vite 配置统一使用 `crmDevBackend()`。根目录仍运行 `pnpm dev`，
后端和 Vite 进程并行启动，但前端开始监听前会等待 `GET /api/health` 返回 CRM 的就绪标记。
Nest 完成模块初始化和 Prisma 初始连接后才开始监听，因此无需设置固定启动延时。

本包源码由 Node ESM 直接加载，相对导入和导出必须写完整的 `.ts` 后缀；
类型检查采用 `NodeNext` 解析，提前发现运行时无法解析的路径。

- 默认后端地址为 `http://127.0.0.1:3000`，避免 localhost 双栈连接产生 AggregateError。
- 每 500ms 检查一次，单次 HTTP 检查最多 1500ms，总等待时间默认 60 秒。
- 超时后给出明确错误，请检查后端编译、数据库连接及端口；不会无限等待或自动重启进程。
- 单独运行某个前端应用的 dev 命令时，同样需要先启动后端。
- 插件仅用于开发服务器，生产 build 不执行等待，也不注入开发代理。

运行中后端重启时，预期的连接拒绝、连接重置或管道断开只输出一次“后端暂不可用”，
响应为 `{ code: 503, data: null, msg }`，附带 `X-Crm-Dev-Backend-Unavailable: 1` 标记。
下一次代理响应到达后提示连接恢复。其他代理错误仍输出原始错误，后端业务异常不会被隐藏。

共享 API 包仅对带该标记的 503 响应有限重试 GET/HEAD 与显式开启的幂等心跳，
创建、修改、删除和登录请求不自动重发。重试耗尽后仍正常返回错误；浏览器 Network 面板
仍会记录每次真实失败，不将失败伪装为成功。

使用自定义后端端口时，三个应用统一配置：

```ts
crmDevBackend({ target: 'http://127.0.0.1:3001', startupTimeoutMs: 60000 })
```

`/api/health` 仅表示 HTTP 服务已启动，不是运行期间的数据库或 Redis 健康诊断。
本工具不启动、停止、重启后端进程，不执行 Prisma 迁移。
