# Workspace 共享包

各目录都是独立的 workspace package，由 pnpm-workspace.yaml 注册。
代码出现实际跨应用复用需求后再提升到此处，后端内部复用优先放在 crm_serve/src/common。

| 包         | 职责                                              | 使用范围                                   |
| ---------- | ------------------------------------------------- | ------------------------------------------ |
| types      | 公开 API 类型与微应用通信类型                     | types/api 为前后端纯类型；微应用类型仅前端 |
| api        | Axios 请求封装、业务接口调用，转导出共享 API 类型 | 前端                                       |
| utils      | Element Plus Message / Notification 封装          | 前端，不能直接当作后端通用工具包           |
| components | 全局筛选、表格等 Vue 组件                         | 前端                                       |
| styles     | 设计令牌、主题、基础样式及进度条样式              | 前端                                       |
| router     | 主应用与子应用的路由协作                          | 前端                                       |
| dev-tools  | 开发环境后端就绪检查及 Vite 插件                  | 开发工具                                   |

前后端共同使用的请求参数和公开响应统一放在 types/src/api/，通过
纯类型入口 @common-crm/types/api 引用，规则见 [共享类型说明](./types/README.md)。
内部数据库模型、密码摘要、JWT 载荷、NestJS DTO 和业务服务不迁移到公共 API 类型中。

页面仍采用 src/views/<业务名>/index.vue、components/、hooks/、types.ts 的组织方式。
页面专用状态与逻辑留在页面目录；公共组件优先基于 Element Plus，出现至少两个页面或应用使用后再提取。
