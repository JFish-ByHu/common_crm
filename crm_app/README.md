# Common CRM 前端基座

本目录包含 qiankun 主应用和业务子应用，是根 pnpm monorepo 的前端部分。

```text
apps/
  alpha/       # 主应用，端口 8800
  customer/    # 客户子应用，端口 8801，激活路由 /customer
  system/      # 系统管理子应用，端口 8802，激活路由 /system
```

## 安装与启动

```bash
cd D:\common_crm
pnpm install
pnpm dev
```

访问 `http://localhost:8800`，通过 `/customer` 和 `/system/users` 进入对应子应用。子应用也可以通过各自端口独立调试。

端口按固定序号分配：主应用使用 `8800`，后续子应用从 `8801` 起依次递增。注册新子应用时，应同时更新其 Vite `port` 和 alpha 中对应的 `entry`。

## 目录约定

三个应用共同使用 `router/`、`services/` 和 `views/<业务名>/index.vue`。业务页面按需要增加 `components/`、`hooks/` 和 `types.ts`，多文件目录通过 `index.ts` 统一导出。

`alpha` 额外维护 `layout/`、`stores/` 和 `micro-apps/`；业务子应用通过 `micro-app/` 保存 qiankun 运行上下文。跨应用通信类型统一由 `@common-crm/types` 提供。

## 新增子应用

复制 `apps/customer`，更换包名、qiankun 应用名、端口和路由前缀；然后在 `apps/alpha/src/micro-apps/registry.ts` 注册其 `name`、`entry` 与 `activeRule`。主应用与子应用之间只通过 qiankun `props` 传递稳定的公共上下文，不直接共享 Pinia 实例。
