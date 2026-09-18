# Common CRM 前端基座

本目录包含 qiankun 主应用和客户子应用，是根 pnpm monorepo 的前端部分。

```text
apps/
  alpha/       # 主应用，端口 8800
  customer/    # 客户子应用，端口 8801，激活路由 /customer
```

## 安装与启动

```bash
cd D:\common_crm
pnpm install
pnpm dev
```

访问 `http://localhost:8800`，点击“客户管理”或直接访问 `http://localhost:8800/customer`。子应用也可单独通过 `http://localhost:8801` 调试。

端口按固定序号分配：主应用使用 `8800`，后续子应用从 `8801` 起依次递增。注册新子应用时，应同时更新其 Vite `port` 和 Shell 中对应的 `entry`。

## 新增子应用

复制 `apps/customer`，更换包名、qiankun 应用名、端口和路由前缀；然后在 `apps/alpha/src/micro-apps.ts` 注册其 `name`、`entry` 与 `activeRule`。主应用与子应用之间只通过 qiankun `props` 传递稳定的公共上下文，不直接共享 Pinia 实例。
