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
- `database`：Prisma 等数据库基础设施。

新增业务时优先保持这一层级。只有模块的业务复杂度确实增长到需要独立领域模型时，
才在该模块内部增加更细的领域分层。
