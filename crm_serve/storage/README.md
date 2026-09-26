# 本地文件存储

上传文件先使用项目内目录管理，默认位置为 `crm_serve/storage/uploads/`。
目录与 `src`、`dist` 平级；编译清理 `dist` 不会删除上传内容。

当前已实现统一上传接口和 `crm_files` 元信息表，详见 [文件上传说明](../src/modules/files/README.md)。
下载、预览和业务关联暂未实现，目录未公开为静态资源。文件模块统一读取 `ConfigService` 的
`storage.uploadDirectory` 配置，写入前按需创建目录，不在业务代码中硬编码磁盘位置。

## 路径配置

未配置 `UPLOAD_DIR` 时默认使用 `storage/uploads`。相对路径始终基于 `crm_serve`
根目录解析，不以终端当前工作目录为基准；也支持本机系统的绝对路径。
配置示例见 `crm_serve/.env.example`，无需为默认目录修改现有环境变量文件。

```dotenv
# 本地开发默认配置
UPLOAD_DIR=storage/uploads

# 部署到 Ubuntu 时，可改为服务器持久化目录
# UPLOAD_DIR=/data/common-crm/uploads
```

本地运行的后端使用本地磁盘；连接远程 MySQL 或 Redis 不会同步上传文件到远程服务器。

## 文件管理约定

- Git 保留目录占位文件 `.gitkeep` 和此说明，忽略 `uploads` 下的实际文件。
- 存储对象使用服务端生成的唯一名称，按 `avatar|image|file/年/月/文件名` 组织；原始名称和相对存储路径保存在文件元数据中，不向前端返回磁盘绝对路径。
- 文件访问通过后续的鉴权接口提供，不把上传目录直接放进前端 `public` 或构建产物。
- 整体复制项目供他人体验时，需要连同上传目录及对应数据库记录一起迁移；仅克隆 Git 仓库不会带上已上传内容。
- 发布或清理项目时保留本目录；备份时同时备份文件内容和数据库记录。更换存储路径不会自动迁移已有文件。
