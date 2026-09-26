# 角色管理

本阶段实现角色增删改查、启停和用户角色分配，一个用户可关联多个角色。
公开请求与响应类型统一来自 `@common-crm/types/api`；分页 DTO 和默认值复用后端 `common/pagination`。
模块位于 `src/modules/roles/`，与 `users/`、`auth/`、`presence/` 同级，按 Controller → Service → Repository 组织。
`roles.module.ts`、`roles.controller.ts` 和 `roles-result.presenter.ts` 保留在根目录，
具体业务实现位于 `services/`、`repositories/`；请求校验放在 `dto/`，实现目录均提供统一入口。

所有接口要求有效的 `Authorization: Bearer <accessToken>`，响应为 `{ code, data, msg }`。
业务接口通过全局权限守卫校验角色授权；角色名称、编码和用户 ID 前缀均不授予管理权限。
分配角色、停用角色会更新权限版本，后续请求重新计算有效权限；登录会话本身保留。
菜单授权接口和保留管理角色约束见 [菜单管理](../menus/README.md)。

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
菜单权限迁移新增受保护的平台管理角色（`isSystem = true`），并将迁移时已有的 `admin` 账号绑定到该角色。

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
删除成功返回 `{ deletedCount }`。失败返回真实 HTTP 4xx/5xx 和六位业务码：
HTTP 400 / 130005 表示参数无效；HTTP 404 / 130001 表示角色不存在（用户不存在复用 120001）；
HTTP 409 / 130002、130003、130004 分别表示编码重复、角色仍有成员、不能新增分配停用角色。
DTO 校验失败为 HTTP 422 / 100002；访问会话失效为 HTTP 401 / 110002。
完整定义位于 @common-crm/errors，由全局过滤器统一转换。

## 前端入口与后续权限

角色页面位于 `crm_app/apps/system/src/views/roles/`，主应用访问路径 `/system/roles`，
由 system 子应用注册路由及菜单。用户管理操作列的“更多 → 分配角色”支持多选及清空。
API 从 `@common-crm/api` 的统一入口导入。

后续菜单管理可新增 `crm_menus`（目录、菜单、按钮）和 `crm_role_menus`（角色授权），
在现有用户 → 角色关联上扩展角色 → 菜单/按钮关联。
动态菜单、路由和按钮展示由授权资源生成，接口仍需服务端按权限码校验；隐藏按钮本身不能替代鉴权。
