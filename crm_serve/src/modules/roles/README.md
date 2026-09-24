# 角色管理

本阶段实现角色增删改查、启停和用户角色分配，一个用户可关联多个角色。
模块位于 `src/modules/roles/`，与 `users/`、`auth/`、`presence/` 同级，按 Controller → Service → Repository 组织。
`roles.module.ts`、`roles.controller.ts` 和 `roles-result.presenter.ts` 保留在根目录，
具体业务实现位于 `services/`、`repositories/`；请求校验放在 `dto/`，实现目录均提供统一入口。

所有接口要求有效的 `Authorization: Bearer <accessToken>`，响应为 `{ code, data, msg }`。
当前仅校验登录会话，尚未根据角色限制接口访问；角色名称、编码和用户 ID 前缀均不授予管理权限。
分配角色、停用角色不会影响现有登录会话或菜单展示。

## 数据模型

迁移：`prisma/migrations/20260922010000_add_roles/migration.sql`，只新增两张表。

| 表               | 字段                        | 约束 / 含义                        |
| ---------------- | --------------------------- | ---------------------------------- |
| `crm_roles`      | `roleId`                    | 主键，服务端生成 `crm_role_<UUID>` |
|                  | `roleName`                  | 必填，最多 64 个字符               |
|                  | `roleCode`                  | 唯一，最多 64 位，创建后不可修改   |
|                  | `roleStatus`                | `1` 启用（默认），`0` 停用         |
|                  | `remark`                    | 可空，最多 255 个字符              |
|                  | `createTime` / `updateTime` | `BIGINT UNSIGNED`，Unix 毫秒时间戳 |
| `crm_user_roles` | `userId` / `roleId`         | 联合主键，避免重复分配             |
|                  | `createTime`                | `BIGINT UNSIGNED`，首次分配时间    |

删除用户级联清理角色关联；删除角色受外键限制，必须先解除全部用户关联。
角色状态和创建时间有组合索引；关联表另有 `roleId` 索引，支持成员统计和反向查询。
本阶段没有默认内置角色，现有用户的角色集合初始为空。

## 接口

| 方法   | 路径                          | 参数及用途                                                     |
| ------ | ----------------------------- | -------------------------------------------------------------- |
| GET    | `/api/roles/list`             | `keyword`、`roleStatus`、可选 `page` / `pageSize`              |
| GET    | `/api/roles/selectList`       | 同列表条件，精简角色选项                                       |
| GET    | `/api/roles/detail`           | `roleId`，获取详情和成员数量                                   |
| POST   | `/api/roles/create`           | `roleName`、`roleCode`，可选 `roleStatus` / `remark`           |
| PATCH  | `/api/roles/update`           | `roleId`，以及 `roleName` / `roleStatus` / `remark` 中至少一项 |
| PATCH  | `/api/roles/updateRoleStatus` | `roleId`、`roleStatus`                                         |
| DELETE | `/api/roles/delete`           | `roleId`                                                       |
| DELETE | `/api/roles/batchDelete`      | `roleIds`，1 至 1000 个不重复的 ID                             |
| GET    | `/api/users/roles`            | `userId`，查询已分配角色，含停用角色                           |
| PATCH  | `/api/users/assignRoles`      | `userId`、`roleIds`，完整替换用户角色集合                      |

查询用 query；写操作所有字段（含 ID）用 JSON 请求体。
`keyword` 对角色 ID、名称、编码执行 OR 模糊查询，和状态条件按 AND 组合。
列表按创建时间倒序、ID 升序排序。两项分页参数都不传时返回全部，`page` / `pageSize` 为 `null`；
传任意一项启用分页，未传部分默认 `1` / `20`，`pageSize` 最大 1000。

`list` / `selectList` 返回 `{ list, total, page, pageSize }`。
选项每项只有 `roleId`、`roleName`、`roleCode`、`roleStatus`；列表、详情和新增/编辑响应额外含
`remark`、`memberCount`、`createTime`、`updateTime`。API 时间使用中国标准时间 `yyyy-MM-dd HH:mm:ss`。

```http
POST /api/roles/create
Content-Type: application/json

{
  "roleName": "销售经理",
  "roleCode": "sales_manager",
  "roleStatus": 1,
  "remark": "负责销售团队"
}
```

角色编码以小写字母开头，只允许小写字母、数字和下划线。
编辑时不可传入 `roleCode`；`remark` 传空字符串或 `null` 表示清空。ID 和时间由服务端维护。

## 分配规则

```http
PATCH /api/users/assignRoles
Content-Type: application/json

{
  "userId": "crm_user_示例UUID",
  "roleIds": ["crm_role_示例UUID"]
}
```

- `roleIds` 必传且最多 1000 个，不可重复；`[]` 表示解除全部关联。
- 必须先成功加载用户已有角色再提交，避免把加载失败误认为空集合。
- 停用角色不能新增分配，已有分配可保留或移除；停用不会自动删除关联。
- 服务端事务内锁定用户、校验并锁定角色，整组替换；任何 ID 不存在或新增角色已停用时整体回滚。
- 同一用户并发分配串行执行，最后成功提交的完整集合生效；保留关联的首次分配时间不变。
- 删除角色前校验成员关联；批删中任一角色不存在或仍有成员时整批取消。

查询与保存用户角色返回的 `data` 均为 `{ userId, roles }`，其中 `roles` 是精简角色选项数组。
删除成功返回 `{ deletedCount }`。已知业务错误沿用 HTTP 200 + 业务码：
`400` 无有效更新字段或分页偏移过大；`404` 用户/角色不存在；
`409` 编码重复、角色仍有成员或尝试新增分配停用角色。
DTO 校验错误为 HTTP / 业务码 `422`，无有效会话为 `401`。

## 前端入口与后续权限

角色页面位于 `crm_app/apps/system/src/views/roles/`，主应用访问路径 `/system/roles`，
由 system 子应用注册路由及菜单。用户管理操作列的“更多 → 分配角色”支持多选及清空。
API 从 `@common-crm/api` 的统一入口导入。

后续菜单管理可新增 `crm_menus`（目录、菜单、按钮）和 `crm_role_menus`（角色授权），
在现有用户 → 角色关联上扩展角色 → 菜单/按钮关联。
动态菜单、路由和按钮展示由授权资源生成，接口仍需服务端按权限码校验；隐藏按钮本身不能替代鉴权。
