# 用户管理接口

所有接口均要求 `Authorization: Bearer <accessToken>`，响应沿用 `{ code, data, msg }`。
当前项目只有登录鉴权，没有角色或权限模型，因此有效登录用户均可调用这些接口。

## 接口列表

| 方法   | 路径                             | 用途         |
| ------ | -------------------------------- | ------------ |
| GET    | `/api/users/list`                | 用户列表     |
| GET    | `/api/users/selectList`          | 用户下拉选项 |
| POST   | `/api/users/create`              | 创建用户     |
| PATCH  | `/api/users/update`              | 编辑用户     |
| PATCH  | `/api/users/updateAccountStatus` | 修改账号状态 |
| DELETE | `/api/users/delete`              | 单个删除     |
| DELETE | `/api/users/batchDelete`         | 批量删除     |

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
`accountStatus`、`createTime`、`updateTime`，不会查询或返回密码。

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

服务端自动生成 UUID 格式的 `userId`，客户端不能指定 ID 或时间字段。
响应 `data` 为新用户的公开资料，字段与用户列表一致。

## 编辑用户

请求体必传 `userId`，可更新 `username`、`email`、`password`，至少传入一项，校验规则与创建相同。
字段省略表示不修改；`email` 传空字符串或 `null` 表示清空邮箱。
传入 `password` 表示管理端重设密码，更新密码与撤销该用户全部登录会话在同一事务中完成。

```http
PATCH /api/users/update
Content-Type: application/json

{
  "userId": "目标用户ID",
  "username": "updated-user",
  "email": null
}
```

响应 `data` 为编辑后的公开资料。账号状态通过下面的独立接口修改。

## 修改账号状态

```http
PATCH /api/users/updateAccountStatus
Content-Type: application/json

{ "userId": "目标用户ID", "accountStatus": 0 }
```

请求体的状态必须是数字 `0` 或 `1`，响应 `data` 为更新后的公开资料。
停用账号会在同一事务内撤销全部登录会话；重新启用后需要重新登录，旧会话不会恢复。

## 单个与批量删除

采用物理删除，数据库外键会级联清理关联登录会话，当前不提供软删除和恢复接口。

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

## 错误约定

与现有认证接口一致，已知业务错误通过响应体 `code` 表达，HTTP 状态为 200：

| 业务码 | 场景                                         |
| ------ | -------------------------------------------- |
| 400    | 编辑未传可更新字段，或分页偏移量超过支持范围 |
| 404    | 待编辑、修改状态或删除的用户不存在           |
| 409    | 用户名或邮箱重复                             |

DTO 校验失败返回 HTTP 422 和业务码 422；未登录、会话失效或账号停用返回 HTTP 401
和业务码 401。未知字段会被拒绝，不会静默用于更新数据库。

## 实现位置

`users.controller.ts` 声明路由与接口注释，`dto/` 校验入参，`users.service.ts`
处理分页默认值、密码摘要和用户 ID 生成，`users.repository.ts` 封装查询、写入和事务。
`users-result.presenter.ts` 负责统一成功与业务错误响应。

数据库中的用户及认证会话时间统一使用 `BIGINT UNSIGNED` 保存 13 位 Unix 毫秒时间戳。
`prisma/migrations/20260920000000_use_epoch_millisecond_timestamps` 负责将已有
`DATETIME` 数据迁移为毫秒时间戳；执行迁移时，数据库会话时区必须与原数据写入时区一致。
