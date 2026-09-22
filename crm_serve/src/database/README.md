# 数据存储模块

MySQL 和 Redis 的连接能力统一放在 `src/database/`，分别由独立的 Nest 模块管理。

```text
database/
├── index.ts
├── README.md
├── mysql/
│   ├── index.ts
│   ├── prisma.module.ts
│   ├── prisma.service.ts
│   └── README.md
└── redis/
    ├── index.ts
    ├── redis.module.ts
    ├── redis.service.ts
    └── README.md
```

业务代码通过 `database/index.ts` 统一导入 `PrismaModule`、`PrismaService`、
`RedisModule` 和 `RedisService`，相对路径按调用文件所在位置调整。

- `PrismaModule` 在 `AppModule` 中注册为全局模块，提供 MySQL 持久数据访问。
- `RedisModule` 由使用 Redis 的业务模块按需导入，提供连接、有限等待和故障降级。
- 各存储模块管理自己的连接、生命周期和配置，业务查询、Key 与 TTL 规则由业务模块维护。

连接行为详见 [MySQL 查询恢复](./mysql/README.md) 和 [Redis 连接管理](./redis/README.md)。
Prisma schema 和迁移文件仍位于后端根目录的 `prisma/`。
