# 文件上传

## 接口

`POST /api/files/upload`，要求 Bearer access token 和接口权限，Content-Type 为
`multipart/form-data`（浏览器通过 FormData 自动生成 boundary）。

| 字段     | 类型 | 说明                                                |
| -------- | ---- | --------------------------------------------------- |
| file     | 文件 | 必填，一次仅上传一个文件                            |
| category | 文本 | 可选，默认 `file`，仅接受 `avatar`、`image`、`file` |

| 分类   | 支持格式                             | 单文件上限 |
| ------ | ------------------------------------ | ---------- |
| avatar | JPG/JPEG、PNG、WebP                  | 5 MB       |
| image  | JPG/JPEG、PNG、WebP、GIF             | 10 MB      |
| file   | PDF、DOCX、XLSX、PPTX、UTF-8 TXT/CSV | 20 MB      |

MB 按 1024 × 1024 字节计算。未开放旧版 DOC/XLS/PPT、宏文档、SVG、HTML、压缩包或可执行文件；Word 文档请使用 DOCX。
分类不允许自定义路径；服务端验证扩展名及内容识别结果，不信任客户端 MIME。
TXT/CSV 检查 UTF-8 编码及控制字符。格式识别不等同于杀毒或完整文档解析；不提供公开静态目录。

成功响应：

```json
{
  "code": 200,
  "data": {
    "fileId": "crm_file_<UUID>",
    "category": "avatar",
    "originalName": "头像.png",
    "mimeType": "image/png",
    "extension": "png",
    "size": 20480,
    "status": "TEMPORARY",
    "createTime": "2026-09-25 16:30:00"
  },
  "msg": "SUCCESS"
}
```

错误沿用 `{ code, data: null, msg }`，code 使用六位业务码（FileErrors）；以下为 HTTP 状态：未登录 401，无权限 403，超出大小 413，
格式不支持或内容与后缀不符 415，缺少文件或参数错误 422，上传并发占满 429。
后端每个进程最多同时处理 4 个上传，以限制磁盘与内容识别的资源占用。

## 存储与数据

默认位置由 `storage.uploadDirectory` 配置，实际开发配置为
`crm_serve/.env.development` 中的 `UPLOAD_DIR=storage/uploads`。

```text
storage/uploads/
  .tmp/upload-<随机串>/        # 流式接收，正常完成或失败后回收
  avatar/2026/09/crm_file_<UUID>.png
  image/2026/09/crm_file_<UUID>.jpg
  file/2026/09/crm_file_<UUID>.docx
```

按中国标准时间的年月归类，文件名由服务端生成，不使用原始文件名作为路径。
`crm_files` 保存原始名、分类、相对存储键、实际 MIME、大小、上传者、临时状态及毫秒时间戳。
上传者从认证会话获取，不接受前端传入。该 ID 作为审计信息保留，不因用户删除而级联删除文件记录。
公开响应不包含存储键、绝对路径或服务器凭据。

文件先流式写入本次请求独立的临时目录，校验通过后移动到分类目录并写入数据库；
数据库写入失败时尝试移除文件。异常退出或数据库提交结果不确定时仍可能遗留文件，
后续需要通过文件记录核对清理，不能只按文件时间盲目删除。

头像已接入用户创建、编辑：上传后为 `TEMPORARY`，保存用户时在同一事务内认领为 `ATTACHED`，
并写入 `crm_users.avatarFileId`。只能绑定当前操作者上传、未关联且未过期的 `avatar` 文件。
用户表通过可空唯一外键关联文件，一份头像文件只绑定一位用户；已有头像 ID 原样提交不重复认领。
替换、移除或删除用户时，旧头像解除关联并变为 `TEMPORARY`，从本次解除时间重新保留 24 小时。
保存失败整体回滚，取消表单不会改动已有头像。

`AvatarCleanupService` 在后端运行期间每小时最多清理 100 个过期且未关联的头像；保留期限统一为
`AVATAR_TEMPORARY_TTL_MS`（24 小时）。先条件更新为 `DELETING`，禁止绑定，再删磁盘文件和记录；
失败留下 `DELETING`，下轮继续。该任务只处理头像，不自动清理 `image`、`file` 类别，也不扫描
缺少元数据的磁盘孤儿文件。清理与用户绑定使用状态条件和数据库关联约束避免误删已绑定文件。

## 头像预览

`GET /api/files/preview?fileId=crm_file_<UUID>` 返回图片二进制，必须携带 Bearer token：

- 当前用户自己的已绑定头像允许访问；其他用户的头像需具备 `GET /users/list` 的实际接口权限。
- 未绑定头像只允许上传者在 24 小时有效期内预览；过期、正在删除、非头像文件返回文件不存在。
- 图片格式限制为 JPEG、PNG、WebP，响应带 `Cache-Control: private, no-store` 和 `X-Content-Type-Options: nosniff`。
- 此接口在全局守卫完成会话校验后，由文件服务做资源归属授权，不单独在菜单管理配置预览权限。
- 用户接口返回的 `avatarUrl` 相对 API baseURL，例如 `/files/preview?fileId=crm_file_...`。
  使用 `loadAvatar(url, signal)` 获取 Blob，再由 `CrmAvatar` 展示；不要直接作为无鉴权的图片地址。

用户编辑弹窗上传完成后本地预览、保存时绑定；表格、详情抽屉和基座顶部使用相同头像字段。
未设置或读取失败时显示默认图标。临时 Blob URL 和未完成请求在切换或卸载时释放。

## 权限与部署

- 新增 Prisma 迁移 `20260925000000_add_file_uploads` 只创建 `crm_files`。
- 停止占用 Prisma 引擎的后端后，执行 `pnpm --filter @common-crm/serve exec prisma generate`，再执行 `pnpm --filter @common-crm/serve exec prisma migrate deploy`。
- 后端由用户启动后，接口清单自动发现 `POST /files/upload`；普通角色需在菜单管理中将其绑定到相应按钮权限并授权。系统管理员沿用既有完整权限。
- 本接口不写死权限标识，不将分类参数作为业务授权依据。用户创建、编辑仍走各自的接口权限，头像绑定另外校验文件归属。
- 迁移 `20260926000000_add_user_avatar` 新增可空头像外键及唯一索引，不改已有用户资料。
- 本地开发需要 Node.js 22 或更新版本。`file-type` 通过动态 import 加载；当前已使用 Node.js 22 的项目环境适配该依赖。

## 前端调用

```ts
import { uploadFile } from '@common-crm/api'

const response = await uploadFile(
  file,
  { category: 'avatar' },
  {
    signal: controller.signal,
    onUploadProgress: event => {
      // event.progress 表示网络传输进度；接口成功返回才表示校验与落库完成。
    }
  }
)
const avatarFileId = response.data?.fileId
```

封装支持 AbortSignal、上传进度和超时设置，默认 120 秒，不自动重试上传。
取消或超时不能保证服务端尚未完成写入，未关联文件后续需统一清理。
后续创建或编辑用户时提交 `avatarFileId`，在业务事务中完成归属校验与关联。
