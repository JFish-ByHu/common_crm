# 菜单与权限配置

菜单管理位于系统子应用 `/system/menus`，入口为 `crm_app/apps/system/src/views/menus/index.vue`。
目录和页面保存在 `crm_menus`，页面操作保存在 `crm_menu_actions`，接口绑定保存在 `crm_api_permission_rules`。
时间列使用毫秒时间戳，公开时间字段返回 `yyyy-MM-dd HH:mm:ss`。

## 配置与授权

1. 创建目录或页面，手动填写唯一权限标识；页面组件和路由路径均可留空，先保存菜单及按钮权限。已授权菜单按启用和导航显示配置展示，空目录也保留；未完整绑定页面时点击提示“该菜单暂未配置页面”，不跳转、不改变当前页面选中态。两项完整配置后才生成可访问路由；填写时仍校验组件及所属应用路径。带参数的详情路由仍需隐藏导航。
2. 在页面的“按钮权限”中配置名称、手动权限标识，以及需要的接口；纯前端操作可不绑定接口。
3. 在角色管理的“分配权限”抽屉勾选菜单及按钮。
4. 在用户管理中为用户分配角色。多个启用角色的权限取并集。

权限标识由管理员手工配置，前端按钮显式绑定相同字符串，例如 `hasPermission('system:users:create')`。
表格操作通过 `permission` 声明权限，`key` 仅用于派发业务事件，按钮点击后的行为由页面代码实现。
不再维护页面操作键清单；新增导出等按钮时直接配置权限标识、实现前端按钮与业务接口，再分配给角色。
改变权限标识不改变按按钮 ID 保存的角色关联，但需要同步修改前端权限字符串。
Controller 不写死业务权限码，仍按数据库中的 HTTP 方法与路径绑定校验。
`componentKey` 只用于选择页面组件；页面通过 `definePage` 在自身 Vue 文件声明，Vite 自动生成组件清单和所属子应用的懒加载映射，详见 `packages/dev-tools/README.md`。
新增页面只需声明一次；名称、路径、导航显示等声明值仅在选择组件时作为表单默认值，数据库配置仍为最终依据。
独立详情页可使用 `/system/users/:userId` 等动态路径，必须隐藏导航并明确分配页面权限；抽屉详情仍作为内部组件，不声明路由。
当前支持必填命名参数，不支持可选参数、通配符或自定义正则；参数名不同但路径结构相同的两个页面会被拒绝保存。
配置菜单不会凭空生成业务页面或接口。

页面和按钮分别授权：只选择页面不会自动授予其所有操作，列表数据需要同时授予“查看”操作。
选择按钮会补齐所属页面和祖先目录。取消页面会取消其下按钮。
隐藏导航不撤销访问权限；停用菜单会使其子树权限失效，停用按钮会禁止其绑定接口。
页面编辑接口可能同时包含账号状态等字段，接口授权按完整业务操作生效，不代表字段级权限。

## HTTP 接口

所有路径以 `/api` 为前缀，成功响应为 `{ code: 200, data, msg: 'SUCCESS' }`。
错误响应为相同结构，HTTP 状态与业务错误码一致。

| 方法   | 路径                         | 参数 / 行为                                                         |
| ------ | ---------------------------- | ------------------------------------------------------------------- |
| GET    | `/menus/list`、`/menus/tree` | 完整管理树，包含停用项、按钮及接口绑定                              |
| POST   | `/menus/create`              | `MenuInput`，创建目录或页面                                         |
| PATCH  | `/menus/update`              | `menuId` + 完整 `MenuInput`，替换配置                               |
| DELETE | `/menus/delete`              | `{ menuId }`                                                        |
| DELETE | `/menus/batchDelete`         | `{ menuIds }`，事务内整批删除                                       |
| GET    | `/menus/endpoints`           | 从 Nest Controller 元数据发现的实际业务接口                         |
| GET    | `/menus/actions/list`        | query `menuId`                                                      |
| POST   | `/menus/actions/create`      | `MenuActionInput`，含 `rules: [{ httpMethod, path }]`               |
| PATCH  | `/menus/actions/update`      | `actionId` + 完整 `MenuActionInput`                                 |
| DELETE | `/menus/actions/delete`      | `{ actionId }`                                                      |
| GET    | `/roles/permissionTree`      | 供角色授权使用的完整权限树                                          |
| GET    | `/roles/permissions`         | query `roleId`；返回 `menuIds`、`actionIds`、`revision`、`isSystem` |
| PATCH  | `/roles/updatePermissions`   | `{ roleId, menuIds, actionIds, revision }`，空数组清空授权          |
| GET    | `/authorization/current`     | 当前用户有效菜单、权限标识及管理角色标志，仅需登录                  |

公开类型统一在 `@common-crm/types/api`；前端调用统一从 `@common-crm/api` 导入。
接口规则的路径不含 `/api`，按 HTTP 方法和完整路由模板唯一匹配，不接受通配符或不存在的接口。
一个接口只能归属于一个按钮权限；一个按钮可绑定多个接口。
后端每次启动自动清理已删除或改名接口的旧绑定，保留按钮及角色授权，并递增权限版本、写入审计。新路径需重新选择绑定，不自动迁移权限。
删除包含子菜单或按钮的菜单会返回 409，请先处理子项；删除按钮同步清理接口规则和角色关联。
菜单、按钮和角色授权变更在同一事务内递增权限版本并写入 `crm_permission_audits`。
角色授权用版本号防止过期界面覆盖新配置，冲突返回 409 并要求重新加载。

## 初始化与保留入口

迁移 `20260924000000_add_menu_authorization` 创建权限表并预置当前系统页面与接口映射。
这些预置权限码是可编辑数据库数据；前端使用同名权限标识，后端通过数据库配置授权。
迁移 `20260924010000_use_permission_codes` 移除操作键字段，保留按钮 ID、已有接口绑定及角色关联，并更新权限版本。
按本次明确要求，仅在迁移时将既有 `admin` 用户绑定到 `isSystem = true` 的平台管理角色。
此后运行时只依据角色关联判定，不依据用户名、roleCode 或用户 ID 前缀授予权限。
保留管理角色不可停用、删除或通过业务接口调整成员；其他用户不能修改管理员资料或密码。
管理员可修改自己的资料；管理员账号不能停用或删除。
菜单管理页面及其上级目录不能停用或隐藏，菜单管理组件不可替换或删除，其路由路径不可清空。

迁移部署：`pnpm --filter @common-crm/serve exec prisma migrate deploy`。
Client 生成：`pnpm --filter @common-crm/serve exec prisma generate`，Windows 上需先自行停止占用引擎的后端服务。
