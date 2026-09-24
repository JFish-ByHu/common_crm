# 共享类型

`@common-crm/types/api` 是前后端共同使用的公开 API 类型入口，使用 `import type` / `export type` 引用。
它只导出声明文件，不包含可执行代码、DOM 类型、Axios、NestJS、Prisma 或 Element Plus 依赖。
`.d.ts` 中的相对导入使用 `.js` 后缀，兼容前端 bundler 和后端 NodeNext 的类型解析；这些导入不会在运行时执行。

```ts
import type { CreateUserRequest, UserListResponse, ApiResponse } from '@common-crm/types/api'
```

| 文件                  | 职责                                        |
| --------------------- | ------------------------------------------- |
| `src/api/common.d.ts` | 统一响应、分页及删除数量                    |
| `src/api/auth.d.ts`   | 登录、Token、当前用户、改密、心跳           |
| `src/api/users.d.ts`  | 用户公开资料、账号/在线状态、查询和写入参数 |
| `src/api/roles.d.ts`  | 角色公开资料、查询和写入参数、用户角色分配  |
| `src/api/index.d.ts`  | API 类型统一入口                            |
| `src/micro-app.ts`    | 前端微应用通信和菜单清单，后端不依赖此入口  |

`PageResponse<T>` 允许 `page`、`pageSize` 为 `null`，对应后端“不传分页参数查询全部”的行为。
`UserListResponse`、`RoleListResponse` 是它的业务别名。
`UserOnlineStatus` 统一表示 `0 | 1 | null`，`UserPresenceItem` 表示包含用户 ID 和在线状态的记录。

API 包继续转导出已有类型，页面原有的 `@common-crm/api` 导入方式保持兼容。
后端 DTO 使用 `implements` 对齐请求字段并保留运行时装饰器校验，公开业务返回值显式引用共享类型。
共享类型不能代替运行时输入校验；修改可选字段时仍需同步 DTO 和对应逻辑。
Prisma 整数状态在响应映射时校验为 `0 | 1`，不使用强制类型断言掩盖非法数据。

数据库记录、密码摘要、会话内部字段、JWT 载荷及 NestJS DTO 类留在后端模块。
后端通过 `common` 复用参数转换和分页逻辑，不依赖前端的 `api` 或 `utils` 运行时代码。
