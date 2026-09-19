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

`alpha` 额外维护 `layout/`、`stores/` 和 `micro-apps/`；业务子应用通过 `micro-app/` 保存 qiankun 运行上下文，并通过 `manifest.ts` 公开导航清单。跨应用通信类型统一由 `@common-crm/types` 提供。

## 路由与导航归属

- Alpha 的 `src/router/index.ts` 只维护登录、控制台、布局，以及清单生成的 `/customer/:pathMatch(.*)*`、`/system/:pathMatch(.*)*` 等子应用前缀入口。未知的应用前缀回到控制台。
- 子应用的 `src/router/index.ts` 维护业务页面、默认页跳转和应用内兜底。例如 System 决定 `/` 跳转 `/users`，嵌入 Alpha 后对应 `/system` 跳转 `/system/users`。
- 子应用的 `src/micro-app/manifest.ts` 维护应用名、路由前缀、模块标题和二级菜单。页面路径与标题由本应用路由和清单共用，菜单路径不包含应用前缀。省略 `menu` 时，模块本身就是菜单入口。
- Alpha 的 `src/micro-apps/modules.ts` 负责子应用入口地址、顶级菜单图标和排序。布局读取清单生成菜单、选中项和面包屑，二级菜单只显示文字。
- `layout/components/MainContent.vue` 常驻子应用容器，按前缀路由的 `meta.microApp` 控制显示，避免浏览器前进后退时出现挂载节点尚未渲染的问题。
- 子应用独立运行时使用 Web History；嵌入时使用 Memory History，通过 qiankun `props.navigation` 同步路由。浏览器地址与历史由 Alpha 统一维护，避免不同 base 的 Vue Router 相互覆盖历史状态。公共适配位于 `packages/router`，卸载子应用时释放订阅。
- 生产部署需为主、子应用分别配置 history fallback，确保深层链接可刷新。

子应用分域部署时，构建的 Vite `base` 必须指向该子应用的资源地址（末尾保留 `/`），例如 `pnpm --filter @common-crm/system exec vite build --base=https://system.example.com/`。默认 `/` 会让 qiankun 中的动态导入请求 Alpha 的资源地址；本地生产产物验证同样需要传入对应的子应用地址。

后续新增业务页面时，在对应子应用创建页面目录，在 `manifest.ts` 的页面配置中声明路径与标题，在子应用路由中绑定组件；需要展示在菜单中时加入清单的 `menu`。无需给 Alpha 新增业务页面路由。

清单通过子应用包的 `./manifest` 导出，Alpha 只依赖这部分纯数据，不导入子应用页面、路由实例或启动代码。这是当前 monorepo 的构建期导航共享：导航清单变化需要同步发布 Alpha，页面实现的变化不需要修改 Alpha 的路由配置。

`pnpm test:router` 验证主子应用导航同步、默认页重定向、历史前进后退和卸载清理。新增 workspace 依赖或包导出后，先执行 `pnpm install`，再手动重启相关前端开发服务，让 Vite 重新解析依赖。

## 新增子应用

复制 `apps/customer`，更换包名、qiankun 应用名、端口和清单中的路由前缀；为 Alpha 增加该子应用的 workspace 依赖，然后在 `apps/alpha/src/micro-apps/modules.ts` 登记清单、入口地址、菜单图标与排序。路由前缀入口、qiankun 激活规则和导航将自动生成。主应用与子应用之间通过 qiankun `props` 传递稳定的公共上下文，不直接共享 Pinia 实例。
