# 用户在线状态

在线状态表示用户存在近期发送心跳的有效登录会话，不表示正在操作鼠标或键盘。
数据只保存在 Redis；不新增用户表字段、在线状态表或 Prisma migration。
模块装配入口为 `presence.module.ts`，在线记录逻辑位于根目录的 `presence.service.ts`，
现有测试位于 `tests/presence.service.spec.ts`。当前没有独立 Controller、DTO 或仓储，不创建对应空目录。

## 判定与存储

- Key：`<REDIS_KEY_PREFIX>:presence:session:<sessionId>`。
- Value：服务端生成的 13 位 Unix 毫秒时间戳，不接受客户端传入身份或时间。
- 每次通过 `SET key timestamp EX 180` 原子写入并续期，禁止拆成 SET 和 EXPIRE。
- 查询先校验 MySQL 中账号启用、会话未撤销且未过期，再批量读取 Redis。
- 同一用户任一有效会话在线，则 `onlineStatus=1`；没有有效会话或全部 Key 过期为 `0`。
- 没有确定在线的会话且存在 Redis 查询失败时返回 `null`，前端展示“未知”。停用账号始终为 `0`。
- Key 查询与删除按 100 个一批使用 pipeline，不使用 `KEYS` 或全库扫描。

登录成功创建会话后登记在线。退出登录清理当前会话；停用、改密、单删和批删清理目标用户会话。
清理必须发生在数据库操作成功之后。并发心跳或 Redis 故障留下的 Key 最多保留一个 TTL，
查询仍以数据库有效会话为准，不会因残余 Key 恢复被撤销会话的在线资格。

## 接口

`POST /api/auth/heartbeat` 使用 Bearer access token 鉴权，不需要请求体。
正常响应为 `{ "code": 200, "data": { "recorded": true }, "msg": "SUCCESS" }`。
Redis 暂时不可用时 `recorded=false`，认证失效仍返回 401，不因心跳延长认证有效期。

`GET /api/users/onlineStatus?userIds=id1,id2` 沿用用户列表鉴权，逗号分隔并去重后最多 100 个 ID。
返回 `data: [{ userId, onlineStatus }]`，不存在的用户不返回。
用户列表与创建、编辑、账号状态修改响应也包含 `onlineStatus`，下拉接口保持三个精简字段。

## 客户端时序

- Alpha 布局挂载后立即心跳，此后每 60 秒发送一次；网络恢复、页面重新可见时补发。
- 同一标签页不会并发心跳，短时间连续恢复事件会合并。切换子应用不重建心跳。
- 后台标签页仍尽力发送心跳。关闭浏览器、断网、系统休眠或浏览器冻结后，依靠 TTL 自动离线。
- 多标签页可以共用同一认证会话；退出该会话后其他标签页同步清理本地认证状态。
- 用户列表每 30 秒查询当前页在线状态，只原地更新状态字段，不增加 loading、不影响勾选。
- 页面隐藏、断网或离开页面时暂停状态查询；切页、筛选、资料写入时取消旧状态请求。
- 心跳和状态轮询不显示 NProgress，网络错误不弹通知；认证失败仍走既有的统一退出逻辑。

状态具有延迟：最后一次心跳后约 180 秒 Key 失效，列表展示还可能延迟一个 30 秒轮询周期。
浏览器无法保证后台定时器精确运行，因此冻结或休眠的页面会被视为离线；恢复后立即续期。
当前登录体系不自动轮换 access token，本功能沿用既有有效期和失效处理。

## Redis 配置

后端沿用 `.env.development` / `.env` 的加载方式，示例见 `crm_serve/.env.example`。

| 配置                                | 说明                                                    |
| ----------------------------------- | ------------------------------------------------------- |
| `REDIS_HOST` / `REDIS_PORT`         | 默认 `127.0.0.1:6379`                                   |
| `REDIS_USERNAME` / `REDIS_PASSWORD` | 可选 ACL 用户名和密码                                   |
| `REDIS_DB`                          | 默认 `0`                                                |
| `REDIS_TLS`                         | 使用 host/port 配置时可设为 `true`                      |
| `REDIS_URL`                         | 可选，优先于上面的连接参数；支持 `rediss://`            |
| `REDIS_KEY_PREFIX`                  | 默认 `crm:<NODE_ENV>`，未设置环境时为 `crm:development` |

不同环境应使用不同前缀，同一环境的后端实例使用相同前缀及 Redis 数据库。
连接和单次操作最多等待 1500ms，未连接时立即降级；禁用离线命令排队及断线命令重放。
连接失败自动退避重连，不阻止后端启动或登录等核心操作；日志不会输出连接字符串或凭据。

`src/database/redis/` 只封装连接、超时和故障降级；本模块维护在线 Key 与 TTL；
`modules/auth/` 负责心跳身份校验和登录生命周期；同级业务模块 `modules/users/` 汇总有效会话并提供公开在线状态。
部署本功能只需安装依赖并由维护者重启后端，不执行 Prisma 迁移或手动清库。
