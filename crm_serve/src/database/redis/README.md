# Redis 连接管理

`RedisModule` 导出 `RedisService`，使用 Redis 的业务模块通过 `database/index.ts`
导入 `RedisModule`，再注入 `RedisService`。

服务在模块初始化时异步连接，销毁时断开。连接失败会退避重连，最长间隔 30 秒；
连接和单次命令超时均为 1500ms。连接未就绪、操作超时或失败时，`execute()` 返回 `null`，
由业务模块决定如何降级。离线命令队列和断线命令重放均关闭。

配置由 Nest `ConfigService` 读取：`REDIS_URL` 优先，也可使用
`REDIS_HOST`、`REDIS_PORT`、`REDIS_USERNAME`、`REDIS_PASSWORD`、`REDIS_DB` 和 `REDIS_TLS`。
`REDIS_KEY_PREFIX` 默认使用 `crm:<NODE_ENV>`，不同环境应设置不同前缀。
示例配置见后端根目录的 `.env.example`。

本目录只提供 Redis 连接与故障降级。会话在线状态的 Key、TTL、查询和清理规则
由 [用户在线状态模块](../../modules/presence/README.md) 管理。
