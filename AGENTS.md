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

## 修改与验证

- 保留用户未提交的修改，避免无关清理和重构。
- 修改后优先运行与影响范围匹配的 typecheck、lint、单元测试或针对性检查，并明确报告未能执行的验证。
- 非必要情况下不执行完整 build。仅在修改构建配置、应用入口、包导出、依赖或打包链路，需要验证生产产物，或用户明确要求时执行。
- 前端和后端服务默认由用户自行启动、停止和重启；除非用户明确要求，否则不操作本地服务进程。
- 运行态验证依赖服务重启才能反映新代码时，完成静态检查并说明该限制，将重启和运行态验证交由用户处理。
