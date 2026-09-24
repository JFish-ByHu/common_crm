# 后端模块结构

业务代码按 Nest 模块组织，每个模块采用直接、固定的调用关系：

```text
Controller -> Service -> Repository / 专用技术服务 -> Prisma / 外部能力
```

以 IAM 认证模块为例：

```text
modules/iam/
├── iam.module.ts
└── auth/
    ├── auth.controller.ts
    ├── auth.service.ts
    ├── auth-token.service.ts
    ├── user.repository.ts
    ├── auth-session.repository.ts
    ├── auth-result.presenter.ts
    ├── dto/
    ├── guards/
    ├── decorators/
    ├── types.ts
    └── index.ts
```

- `controller`：声明路由、接收 DTO、调用业务服务并返回响应。
- `service`：编排业务规则和事务边界，不直接编写 SQL 或 Prisma 查询。
- `repository`：封装 Prisma 查询和持久化事务。
- 专用技术服务：封装 JWT、文件存储等有明确职责的技术能力。
- `dto`、`guards`、`decorators`：仅服务当前业务模块时就近放置。
- `common`：跨业务模块复用的 HTTP 响应等通用代码。
- `database`：统一组织 MySQL（`mysql/`，通过 Prisma 访问）与 Redis（`redis/`）基础设施，通过 `index.ts` 导出。

新增业务时优先保持这一层级。只有模块的业务复杂度确实增长到需要独立领域模型时，
才在该模块内部增加更细的领域分层。

## 用户管理

`modules/users/` 与 `modules/iam/` 同级，负责平台用户查询、创建、编辑、账号状态修改
和单个/批量删除，由独立的 `UsersModule` 装配。

```text
modules/
├── index.ts
├── iam/
│   ├── auth/
│   ├── presence/
│   ├── iam.module.ts
│   └── index.ts
├── roles/
│   ├── dto/
│   ├── roles.controller.ts
│   ├── roles.service.ts
│   ├── roles.repository.ts
│   ├── roles-result.presenter.ts
│   ├── roles.error.ts
│   ├── roles.module.ts
│   ├── types.ts
│   └── index.ts
└── users/
    ├── dto/
    ├── users.controller.ts
    ├── users.service.ts
    ├── users.repository.ts
    ├── users-result.presenter.ts
    ├── users.error.ts
    ├── users.module.ts
    ├── types.ts
    └── index.ts
```

`AppModule` 通过 `modules/index.ts` 引入 IAM、用户管理和角色管理三个业务模块。
`UsersModule` 导入 `IamModule` 复用鉴权守卫、认证服务、会话仓储与在线状态模块，
同时导入 `RolesModule` 复用用户角色分配服务。`RolesModule` 仅依赖 `IamModule` 的鉴权能力。
`IamModule` 不反向导入用户或角色管理模块，也不重复注册其 Controller 和 Service。
`iam/auth/user.repository.ts` 保留认证专用的账号读取与密码修改，
`users/users.repository.ts` 处理管理端公开字段和管理事务。

接口路径保持 `/api/users/*`，参数、响应与删除语义见 [用户管理接口说明](./users/README.md)。

## 角色管理

`modules/roles/` 负责角色增删改查、启停、成员统计和用户角色关联。
角色分配接口由 `UsersController` 提供入口，调用 `RolesService`，关联事务集中在角色仓储中。
本阶段只维护角色资料和关联，菜单/按钮授权留给后续菜单管理实现。
数据模型、接口和约束见 [角色管理说明](./roles/README.md)。

## 在线状态

`modules/iam/presence/` 维护会话级 Redis 在线记录，由认证和用户管理服务共同调用。
`src/database/redis/` 提供共享 Redis 连接与故障降级，MySQL 登录会话仍是鉴权依据。
无需新增表或用户字段，接口与客户端心跳规则见 [用户在线状态](./iam/presence/README.md)。
