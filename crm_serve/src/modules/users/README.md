# 用户管理接口

所有接口均要求 `Authorization: Bearer <accessToken>`，响应沿用 `{ code, data, msg }`。
公开请求与响应类型统一来自 `@common-crm/types/api`；DTO 保留装饰器校验，分页共用后端 `common/pagination`。
接口现由全局权限守卫校验菜单管理配置的接口权限；用户通过启用角色获得访问能力，未授权返回 HTTP 403。系统管理角色受保护，管理员资料只能由本人修改，账号不能停用或删除。

## 接口列表

| 方法   | 路径                             | 用途           |
| ------ | -------------------------------- | -------------- |
| GET    | `/api/users/list`                | 用户列表       |
| GET    | `/api/users/selectList`          | 用户下拉选项   |
| GET    | `/api/users/onlineStatus`        | 批量在线状态   |
| POST   | `/api/users/create`              | 创建用户       |
| PATCH  | `/api/users/update`              | 编辑用户       |
| PATCH  | `/api/users/updateAccountStatus` | 修改账号状态   |
| DELETE | `/api/users/delete`              | 单个删除       |
| DELETE | `/api/users/batchDelete`         | 批量删除       |
| POST   | `/api/users/logout`              | 强制登出       |
| GET    | `/api/users/roles`               | 已分配角色     |
| GET    | `/api/users/permissions`         | 有效权限与来源 |
| PATCH  | `/api/users/assignRoles`         | 分配角色       |

`accountStatus` 为数字：`1` 正常，`0` 停用。

接口路径采用 `/资源/动作` 风格，动作使用小驼峰命名。查询参数放在 query 中，
创建、编辑、状态修改和删除的参数统一放在 JSON 请求体中，包括所需的 `userId`。

## 列表与下拉选项

两个查询接口共用可选分页参数：

- `page`：从 1 开始的正整数。
- `pageSize`：1 至 1000 的整数。
- 两项都不传时查询全部匹配数据，响应中的 `page`、`pageSize` 为 `null`。
- 传入任意一项时启用分页；未传入的 `page` 默认 1，`pageSize` 默认 20。
- 空字符串、零、负数、小数和重复 query 参数均不作为有效分页值。
- 超出末页时 `list` 为空，`total` 仍为全部匹配记录数。

用户列表额外支持 `keyword` 和 `accountStatus`。`keyword` 去除首尾空格后，对
`userId`、`username`、`email` 按 OR 模糊查询；`accountStatus` 与关键字条件按 AND
组合。空关键字不添加检索条件。返回字段为 `userId`、`username`、`email`、
`accountStatus`、`onlineStatus`、`createTime`、`updateTime`、`roles`，不会查询或返回密码。
`roles` 包含已分配角色的 `roleId`、`roleName`、`roleCode`、`roleStatus`、`isSystem`，包含停用角色。
角色通过关联查询随列表一起返回，前端不逐行请求角色接口。

```http
GET /api/users/list
GET /api/users/list?keyword=admin&accountStatus=1
GET /api/users/list?keyword=admin&accountStatus=0&page=1&pageSize=20
```

下拉接口使用 `username` 模糊检索，列表每项严格只包含 `userId`、`username`、
`accountStatus`。该接口包含正常和停用账号，调用方可根据状态决定选项是否禁用。

```http
GET /api/users/selectList
GET /api/users/selectList?username=admin&page=1&pageSize=20
```

两个接口均按创建时间倒序、用户 ID 升序稳定排列。用户列表中的 `createTime`、
`updateTime` 由服务端按中国标准时间格式化为 `yyyy-MM-dd HH:mm:ss`，例如
`2026-09-20 15:16:05`；客户端无需再次转换日期格式。
例如不分页的下拉响应：

```json
{
  "code": 200,
  "data": {
    "list": [{ "userId": "示例用户ID", "username": "admin", "accountStatus": 1 }],
    "total": 1,
    "page": null,
    "pageSize": null
  },
  "msg": "SUCCESS"
}
```

## 查看用户权限

`GET /api/users/permissions?userId=用户ID` 返回 `UserPermissionsResponse`：用户基本信息、权限版本、管理员标志、已分配角色及有效菜单/按钮树。
查询实时读取数据库同一快照，与实际鉴权共用授权计算逻辑；每个菜单和按钮的 `sourceRoles` 标明授权来源。
多个启用角色的权限取并集；停用角色、停用菜单及其后代、停用按钮均不计入。仅隐藏导航不撤销访问。
账号停用时有效菜单为空，保留角色信息帮助排查。管理员标记“全部权限（含后续新增权限）”，菜单树展示当前启用配置。
用户不存在时返回HTTP 404 / 120001 用户不存在错误。接口不写死权限标识，沿用数据库接口映射和全局守卫。
数据迁移 `20260924020000_add_user_permission_view` 添加“查看权限”按钮及接口绑定，默认不向普通角色追加授权；可在角色管理中分配。
前端通过 `system:users:viewPermissions` 控制“查看权限”操作，详情默认使用只读抽屉，不修改角色或授权。

## 在线状态

`onlineStatus` 为 `1` 在线、`0` 离线、`null` 未知，不写入用户表。
状态结合有效登录会话与 Redis 心跳判定；停用账号和没有有效会话的用户均为离线。
Redis 故障不会使用户列表请求失败，有效会话的在线状态暂时显示未知。

```http
GET /api/users/onlineStatus?userIds=用户ID1,用户ID2
```

参数必传，去重后最多 100 个非空 ID，每个最长 64 个字符。返回示例：

```json
{
  "code": 200,
  "data": [
    { "userId": "用户ID1", "onlineStatus": 1 },
    { "userId": "用户ID2", "onlineStatus": null }
  ],
  "msg": "SUCCESS"
}
```

不存在的用户不返回。该接口用于静默更新当前页，不替代用户列表的资料查询。
更多生命周期和配置说明见 [用户在线状态](../presence/README.md)。

## 创建用户

`username`、`password` 必传；用户名去除首尾空格后不能为空，最多 64 个字符。
密码至少 6 个字符、UTF-8 编码最多 72 字节；密码保留首尾空格，使用 bcrypt 保存摘要。
`email` 可省略，空字符串或 `null` 表示无邮箱；非空邮箱去除首尾空格并转为小写，
最多 255 个字符。`accountStatus` 可省略，默认 1。

```http
POST /api/users/create
Content-Type: application/json

{
  "username": "new-user",
  "password": "ExamplePass123!",
  "email": "new-user@example.com",
  "accountStatus": 1
}
```

服务端通过 `common` 统一导出的 `createUserId()` 生成 `crm_user_<UUID>` 格式的 `userId`，
例如 `crm_user_c181b50a-6b54-4553-af06-3ec271241520`。客户端不能指定 ID 或时间字段。
响应 `data` 为新用户的公开资料，字段与用户列表一致。

管理员账号的 ID 使用 `crm_admin_<UUID>`，由 `createAdminUserId()` 生成。
当前新增接口创建普通用户，项目暂未提供管理员初始化入口。角色分配不会更改用户 ID 或自动授予管理权限。
后续管理员初始化入口应显式调用管理员 ID 生成方法，不根据 `username` 推断身份。
前缀只用于标识格式，不能代替权限校验；修改用户名不会改变已有 ID。
历史 ID 继续兼容查询与鉴权，需要统一历史格式时通过显式数据迁移处理。

迁移 `20260922000000_normalize_user_id_prefixes` 为历史裸 UUID 补齐 `crm_user_` 前缀，
并将已确认的初始管理员 `crm_user_01a05a9f-6991-72cd-ad6d-47ec8f9686f6`
调整为 `crm_admin_01a05a9f-6991-72cd-ad6d-47ec8f9686f6`，保留原 UUID 后缀。
迁移在事务内撤销受影响的登录会话并更新用户 ID，关联会话通过外键 `ON UPDATE CASCADE` 同步。
执行后受影响账号需要重新登录；旧 Redis 会话 Key 应按受影响的 sessionId 清理，TTL 为清理失败的兜底。

## 编辑用户

请求体必传 `userId`，可更新 `username`、`email`、`password`、`accountStatus`，至少传入一项，校验规则与创建相同。
字段省略表示不修改；`email` 传空字符串或 `null` 表示清空邮箱。
`accountStatus` 只接受数字 `0` 或 `1`，可与用户资料一起保存。
传入 `password` 表示管理端重设密码；重设密码或停用账号时，资料、账号状态的更新与
撤销该用户全部登录会话在同一事务中完成。事务成功后清理相关 Redis 在线记录。
重新启用账号不会恢复之前撤销的会话。

```http
PATCH /api/users/update
Content-Type: application/json

{
  "userId": "目标用户ID",
  "username": "updated-user",
  "email": null,
  "accountStatus": 0
}
```

响应 `data` 为编辑后的公开资料。编辑弹窗使用此接口一次保存资料和状态；
列表中的状态开关继续使用下面的独立接口。

## 修改账号状态

```http
PATCH /api/users/updateAccountStatus
Content-Type: application/json

{ "userId": "目标用户ID", "accountStatus": 0 }
```

请求体的状态必须是数字 `0` 或 `1`，响应 `data` 为更新后的公开资料。
停用账号会在同一事务内撤销全部登录会话；重新启用后需要重新登录，旧会话不会恢复。

## 单个与批量删除

采用物理删除，数据库外键会级联清理关联登录会话及用户角色关联，当前不提供软删除和恢复接口。

```http
DELETE /api/users/delete
Content-Type: application/json

{ "userId": "目标用户ID" }
```

```http
DELETE /api/users/batchDelete
Content-Type: application/json

{ "userIds": ["用户ID1", "用户ID2"] }
```

批量删除接收 1 至 1000 个不重复的用户 ID。任一 ID 不存在时整批回滚；
不会静默跳过不存在的用户，也不会按部分 ID 删除。
删除成功的 `data` 为 `{ "deletedCount": 1 }` 或实际批量删除数量。

## 用户角色分配

`GET /api/users/roles?userId=目标用户ID` 返回 `{ userId, roles }`，包含该用户已分配的停用角色。

`PATCH /api/users/assignRoles` 接收 JSON `{ "userId": "目标用户ID", "roleIds": ["角色ID"] }`，
事务内完整替换该用户的角色集合。数组最多 1000 项且不可重复；空数组解除全部角色。
停用角色不能新增分配，已有停用角色可保留或移除。用户或角色不存在时整组操作失败。
查询和保存响应中的 `roles` 每项为 `roleId`、`roleName`、`roleCode`、`roleStatus`。

角色关联由 `RolesService` 统一维护；`UsersModule` 导入 `RolesModule` 复用该服务。
完整接口及后续菜单权限扩展见 [角色管理说明](../roles/README.md)。

## 错误约定

失败返回 HTTP 4xx/5xx 和六位业务码，不再使用 HTTP 200 承载失败。

| 业务码          | HTTP | 场景                           |
| --------------- | ---- | ------------------------------ |
| 120005          | 400  | 用户参数无效或没有可更新字段   |
| 120001          | 404  | 用户不存在                     |
| 120002 / 120003 | 409  | 用户名重复 / 邮箱重复          |
| 120004          | 409  | 未能识别具体字段的唯一约束冲突 |
| 120006          | 403  | 系统管理员账号受保护           |

DTO 校验失败为 HTTP 422 / 100002；访问会话失效为 HTTP 401 / 110002。未知字段仍拒绝。
完整定义位于 @common-crm/errors。

## 实现位置

本模块位于 `src/modules/users/`，与 `auth/`、`presence/`、`roles/` 同级，由 `UsersModule` 独立装配。
`UsersModule` 导入 `AuthModule` 复用鉴权和认证会话，导入 `PresenceModule` 获取在线状态；两者均不反向依赖用户管理模块。

`users.controller.ts` 声明路由与接口注释，`dto/` 校验入参，`services/users.service.ts`
处理分页默认值、密码摘要和用户 ID 生成，`repositories/users.repository.ts` 封装查询、写入和事务。
根目录的 `users-result.presenter.ts` 只包装成功响应，业务异常由全局过滤器处理，测试按需放在 `tests/`。

数据库中的用户及认证会话时间统一使用 `BIGINT UNSIGNED` 保存 13 位 Unix 毫秒时间戳。
`prisma/migrations/20260920000000_use_epoch_millisecond_timestamps` 负责将已有
`DATETIME` 数据迁移为毫秒时间戳；执行迁移时，数据库会话时区必须与原数据写入时区一致。
