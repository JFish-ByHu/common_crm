# 可选分页

用户、角色查询 DTO 继承 `PaginationDto`，共享 `page` / `pageSize` 的转换和校验。
`resolvePagination(query, createInvalidInputError)` 补齐默认值并校验偏移量，错误由调用模块提供，保留原有业务码及提示。

- 两个分页参数都省略时返回 `undefined`，仓储查询全部，响应分页字段为 `null`。
- 传任意一项则启用分页，缺省页码为 1、每页数量为 20。
- 页码为 1 至 2147483647 的整数，每页数量为 1 至 1000 的整数。
- 偏移量 `(page - 1) * pageSize` 不能超过 2147483647。
- 空字符串、重复 query 参数、布尔值、小数等继续由 DTO 校验拒绝。

`common/validation` 提供共用的 `trimString`、`queryInteger`；邮箱归一化、备注清空等业务转换继续保留在各模块。
请求/响应结构通过 `@common-crm/types/api` 共享；装饰器、转换和分页执行逻辑仅留在后端。
