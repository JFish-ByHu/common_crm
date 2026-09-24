# 认证模块

认证接口入口为根目录的 `auth.controller.ts`，模块装配入口为 `auth.module.ts`。
接口沿用 `/api/auth/*`，本次目录调整不改变请求参数、响应和登录行为。

| 位置                                      | 职责                                         |
| ----------------------------------------- | -------------------------------------------- |
| `services/auth.service.ts`                | 登录、会话轮换、退出、密码修改及访问会话校验 |
| `services/auth-token.service.ts`          | JWT 签发、校验和 refresh token 摘要          |
| `repositories/auth-user.repository.ts`    | 认证专用账号查询、密码修改与会话撤销         |
| `repositories/auth-session.repository.ts` | 登录会话持久化及有效会话查询                 |
| `auth-result.presenter.ts`                | 成功与已知业务错误的统一响应                 |
| `dto/`                                    | 请求参数校验                                 |
| `guards/`                                 | access token 和会话鉴权                      |
| `decorators/`                             | 提取当前用户                                 |
| `tests/`                                  | 认证业务测试                                 |
| `types.ts`、`auth.error.ts`               | 模块内部类型和业务错误                       |

`AuthUserRepository` 服务于认证流程，用户管理资料和管理事务由
`users/repositories/users.repository.ts` 负责。

`AuthModule` 依赖 `PresenceModule` 维护登录生命周期中的在线记录；不依赖用户或角色管理模块。
根目录 `index.ts` 对外公开 `AuthModule`、`AccessTokenGuard`、`AuthService`、`AuthSessionRepository`，
后三项也由 Nest 模块导出，供其他模块注入使用。
各实现目录提供统一入口，同目录内部依赖使用具体文件，避免循环加载。
