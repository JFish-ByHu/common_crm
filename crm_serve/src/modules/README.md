# 后端模块结构

业务代码按 Nest 模块组织，每个模块采用直接、固定的调用关系：

```text
Controller -> Service -> Repository / 专用技术服务 -> Prisma / 外部能力
```

以认证模块为例：

```text
modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── services/
│   ├── auth.service.ts
│   ├── auth-token.service.ts
│   └── index.ts
├── repositories/
│   ├── auth-user.repository.ts
│   ├── auth-session.repository.ts
│   └── index.ts
├── auth-result.presenter.ts
├── tests/
│   └── auth.service.spec.ts
├── dto/
├── guards/
├── decorators/
├── auth.error.ts
├── types.ts
└── index.ts
```

- 根目录的 `*.module.ts`、`*.controller.ts`：模块装配、声明路由、接收 DTO、调用业务服务并返回响应。
- `services/`：编排业务规则和事务边界，不直接编写 SQL 或 Prisma 查询。
- `repositories/`：封装 Prisma 查询和持久化事务。
- 根目录的 `*-result.presenter.ts`：将业务结果和业务错误转换为统一响应；出现多个相关实现时再建立 `presenters/`。
- `tests/`：当前业务模块的测试，文件使用 `*.spec.ts` 命名，沿用现有 Jest 发现规则。
- 根目录的 `types.ts`、`*.error.ts`：内部类型和业务错误。
- 专用技术服务：封装 JWT、文件存储等有明确职责的技术能力。
- `dto`、`guards`、`decorators`：仅服务当前业务模块时就近放置。
- `common`：跨业务模块复用的 HTTP 响应等通用代码。
- `common/pagination`、`common/validation`：共用分页 DTO、默认值与参数转换，业务模块保留自己的错误映射。
- `@common-crm/types/api`：前后端共用的公开请求/响应类型，DTO 保留运行时校验，模块内部持久化类型仍放在本地。
- `database`：统一组织 MySQL（`mysql/`，通过 Prisma 访问）与 Redis（`redis/`）基础设施，通过 `index.ts` 导出。

新增业务遵循相同结构，目录按实际职责创建，不预建空目录。
常规业务模块保留 `services/`、`repositories/`、`dto/` 等核心分类；`presence` 这类只有一个服务的小模块可将服务直接放在根目录。
单个辅助实现优先放根目录，避免为了形式统一增加无用层级。
实现目录通过 `index.ts` 统一导出；同目录实现之间直接引用，避免通过自身入口形成循环依赖。
模块根 `index.ts` 只公开其他模块需要的能力，内部 Controller、DTO、错误等不对外批量导出。
测试可直接引用和 mock 具体实现；`tests/` 不提供统一导出，避免业务代码加载测试文件。

## 用户管理

`modules/users/` 与 `modules/auth/`、`modules/roles/` 同级，负责平台用户查询、创建、编辑、账号状态修改
和单个/批量删除，由独立的 `UsersModule` 装配。

```text
modules/
├── index.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── services/
│   ├── repositories/
│   ├── auth-result.presenter.ts
│   ├── tests/
│   └── index.ts
├── presence/
│   ├── presence.module.ts
│   ├── presence.service.ts
│   ├── tests/
│   ├── types.ts
│   └── index.ts
├── roles/
│   ├── dto/
│   ├── roles.controller.ts
│   ├── services/
│   ├── repositories/
│   ├── roles-result.presenter.ts
│   ├── roles.error.ts
│   ├── roles.module.ts
│   ├── types.ts
│   └── index.ts
└── users/
    ├── dto/
    ├── users.controller.ts
    ├── services/
    ├── repositories/
    ├── users-result.presenter.ts
    ├── tests/
    ├── users.error.ts
    ├── users.module.ts
    ├── types.ts
    └── index.ts
```

`AppModule` 通过 `modules/index.ts` 引入 `AuthModule`、`UsersModule` 和 `RolesModule`。
`UsersModule` 导入 `AuthModule` 复用鉴权守卫、认证服务和会话仓储，
导入 `PresenceModule` 获取在线状态，导入 `RolesModule` 复用用户角色分配服务。
`RolesModule` 依赖 `AuthModule` 的鉴权能力；`AuthModule` 调用 `PresenceModule` 维护登录生命周期中的在线记录。
`AuthModule` 不反向导入用户或角色管理模块，`PresenceModule` 不依赖其他业务模块，避免循环依赖。
`auth/repositories/auth-user.repository.ts` 的 `AuthUserRepository` 保留认证专用的账号读取与密码修改，
`users/repositories/users.repository.ts` 的 `UsersRepository` 处理管理端公开字段和管理事务。

接口路径保持 `/api/users/*`，参数、响应与删除语义见 [用户管理接口说明](./users/README.md)。

## 角色管理

`modules/roles/` 负责角色增删改查、启停、成员统计和用户角色关联。
角色分配接口由 `UsersController` 提供入口，调用 `RolesService`，关联事务集中在角色仓储中。
菜单与按钮授权已接入 `menus/`，统一运行时鉴权位于 `authorization/`。
数据模型、接口和约束见 [角色管理说明](./roles/README.md)。

## 菜单授权

`menus/` 维护目录、页面、按钮、手工权限标识及真实接口映射，并提供角色授权配置能力。
`authorization/` 负责全局鉴权、有效权限计算和带数据库版本的 Redis 缓存。
`RolesModule -> MenusModule -> AuthorizationModule -> AuthModule`，无反向依赖。
详见 [菜单管理](./menus/README.md) 与 [运行时授权](./authorization/README.md)。

## 在线状态

`modules/presence/` 维护会话级 Redis 在线记录，由认证和用户管理服务共同调用。
`src/database/redis/` 提供共享 Redis 连接与故障降级，MySQL 登录会话仍是鉴权依据。
无需新增表或用户字段，接口与客户端心跳规则见 [用户在线状态](./presence/README.md)。
