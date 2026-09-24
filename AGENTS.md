# Common CRM 开发约定

## 命令执行

- Windows shell 命令统一使用 PowerShell 7（`pwsh.exe`）执行，不使用 `cmd.exe` 或 Windows PowerShell 5.1。
- 工具调用时显式指定 PowerShell 7 shell；若当前 PowerShell 7 安装路径包含版本号，以本机实际安装路径为准。

## 前端目录与组件化

- 新业务页面遵循 `src/views/<业务名>/index.vue`、`components/`、`hooks/`、`types.ts` 的结构，参考 `src/views/login`。
- 应用级布局遵循 `src/layout/index.vue` 作为编排入口，具体业务区域放在 `src/layout/components/`。
- 入口文件负责路由、状态和数据流编排；可复用或职责单一的视图区域拆为组件，通过 props/emits 传递数据和事件。
- 同一作用类型下的多个模块（例如 stores、services、hooks、utils）必须提供目录级统一入口 `index.ts`；业务代码优先从统一入口导入，避免散落引用具体实现文件。
- 优先使用 Element Plus 组件，只有被两个或以上页面或应用复用时才提升到 `packages`。
- 详情展示默认优先使用 Element Plus 抽屉组件 `el-drawer`；只有用户明确要求时才使用弹窗或其他展示方式。
- 详情字段优先使用无边框的 `el-descriptions` / `el-descriptions-item` 基础样式，不使用带网格边框的表格样式，除非用户明确要求。

## 函数与方法命名

- 前端与共享包中的普通函数统一使用箭头函数；NestJS Controller、Service 等依赖类方法、装饰器或框架生命周期的场景保留标准类方法写法。
- 所有函数、方法及承载函数的变量或属性均禁止以 `handle` 开头，适用于前端、后端和共享包，事件回调也遵循此规则。
- 名称必须表达具体业务语义，优先使用“动作 + 对象”的小驼峰形式，例如删除用户 `deleteUser`、选择用户 `selectUser`、查询用户列表 `queryUserList`、切换账号状态 `updateAccountStatus`。
- 禁止使用 `handleClick`、`handleSubmit`、`handleChange`、`handleDeleteUser` 等名称；应根据实际职责命名为 `selectUser`、`createUser`、`updateAccountStatus`、`deleteUser` 等，不能只替换前缀而保留模糊语义。
- 重命名时同步更新调用方、模板事件绑定及相关导出，保持名称与实际行为一致。

## 后端接口命名

- 新增和调整业务接口时采用 `/资源/动作` 路径，明确表达操作语义，不仅依靠 HTTP 方法区分同一路径的增删改查。
- 统一使用 `list` 查询列表、`selectList` 查询下拉选项、`create` 创建、`update` 编辑、`delete` 单删、`batchDelete` 批删；创建统一使用 `create`，不混用 `add`。
- 其他动作使用语义明确的小驼峰名称，例如 `updateAccountStatus`。查询使用 GET 和 query 参数，创建使用 POST，编辑使用 PATCH，删除使用 DELETE；写操作所需的 ID 与其他参数一并放入 JSON 请求体。
- 接口调整时同步 Controller 注释、DTO、调用方和接口文档；已有接口未在本次修改范围内时不批量改名。

## 用户 ID 规则

- 新增普通用户的 `userId` 必须为 `crm_user_<UUID>`，管理员账号必须为 `crm_admin_<UUID>`，保留 UUID 中的连字符。
- 用户 ID 由服务端生成，通过 `crm_serve/src/common` 统一导出的 `createUserId()`、`createAdminUserId()` 复用，禁止直接用裸 UUID 创建用户或由前端指定 ID。
- 管理员账号的创建或初始化流程应显式选择管理员 ID 生成方法；禁止根据可编辑的用户名或 ID 前缀授予权限。
- 用户 ID 创建后保持稳定，编辑资料不重新生成 ID；历史 ID 格式调整必须通过显式迁移处理，并同步关联记录及登录会话。

## 修改与验证

- 保留用户未提交的修改，避免无关清理和重构。
- 修改后优先运行与影响范围匹配的 typecheck、lint、单元测试或针对性检查，并明确报告未能执行的验证。
- 非必要情况下不执行完整 build。仅在修改构建配置、应用入口、包导出、依赖或打包链路，需要验证生产产物，或用户明确要求时执行。
- 前端和后端服务默认由用户自行启动、停止和重启；除非用户明确要求，否则不操作本地服务进程。
- 运行态验证依赖服务重启才能反映新代码时，完成静态检查并说明该限制，将重启和运行态验证交由用户处理。
