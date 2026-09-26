# 业务错误目录

唯一维护入口为 `src/common.js`、`auth.js`、`users.js`、`roles.js`、`menus.js`、`files.js`。
六位错误码的前两位为模块号（10 至 15），后四位为模块内稳定序号。成功仍为 200/201。
HTTP 状态与业务码分开：用户名重复返回 HTTP 409，响应为
`{ code: 120002, data: null, msg: '用户名已存在' }`。

```ts
import { FileErrors, UserErrors } from '@common-crm/errors'
import { BusinessError } from '../../common'

throw new BusinessError(UserErrors.USERNAME_EXISTS)
// 动态文案参数受类型检查约束，大小策略仍由上传模块维护。
throw new BusinessError(FileErrors.FILE_TOO_LARGE, { maxSizeMB: 5 })
```

后端全局过滤器统一捕获 `BusinessError`，按定义的 `httpStatus` 返回错误，
不把可预期业务失败作为未知异常输出堆栈。未知异常只返回通用错误文案，内部原因进入日志。
认证、用户、角色现有模块错误类为兼容调用方而保留，统一继承 `BusinessError`，不再各自维护中文映射。
普通 Nest `HttpException`（如路由不存在）按 HTTP 状态转换为通用目录定义，不透传任意异常内容。

前端 `ApiError.code` 表示业务码，`ApiError.status` 表示 HTTP 状态。
需要具体分支时比较共享常量；普通页面通过 `notifyRequestError(error, { title, message })`
显示后端可公开文案。权限/会话问题使用 warning，其余失败使用 error；登录凭据错误使用 error。
请求层按会话处理 401，已处理的异常标记 `notificationHandled`，页面不重复通知；取消请求不通知。
请求层兼容旧 code 401/403 和旧 HTTP 200 错误响应，以支持前后端更新过渡。

## 维护与检查

- 新增错误追加新编号，不复用废弃码，不因文字调整而改码。
- 同类错误复用语义定义，例如角色关联中的用户不存在使用 `UserErrors.USER_NOT_FOUND`。
- 字段校验复用通用 100002，不为每个必填项分配业务码。
- 错误定义不存数据库、不允许后台随意编辑；不根据中文文案判断行为。
- `src` 使用原生 ESM + JSDoc，浏览器及 Node.js 22.12+ 的 CommonJS 均可直接加载，无需单独编译运行时代码。
- `types/` 通过 TypeScript 从同一源码生成，纳入版本管理，不手动维护第二份 code/msg。
- 修改目录后执行 `pnpm --filter @common-crm/errors typecheck`，生成声明并检查编号唯一性、号段、HTTP 状态及文案；根目录 `pnpm typecheck` 同样包含该检查。
- `scripts/check-codes.mjs` 是错误目录的静态完整性检查，不会请求接口或连接数据库。

本次迁移将过去 HTTP 200 + 400/401/404/409 的失败改为真实 HTTP 4xx/5xx + 六位业务码。
外部调用方也需要同步调整。无需数据库迁移；已有测试若断言旧返回语义，应在维护测试时同步更新。
