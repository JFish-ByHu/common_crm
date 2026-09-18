# 后端模块结构

`src/modules` 按限界上下文组织业务模块。每个模块使用相同的依赖方向：

```text
presentation -> application -> domain
infrastructure -> application/domain
```

- `domain`：实体、值对象和仓储契约，不依赖 Nest、Prisma、JWT 或 HTTP。
- `application`：业务用例、输入输出契约和外部能力端口。
- `infrastructure`：Prisma、JWT、密码摘要等端口实现。
- `presentation/http`：Controller、DTO、Guard 和响应转换。
- `<module>.module.ts`：模块内部依赖装配。

应用级 `src/app` 只负责加载配置、共享基础设施和业务模块。跨模块通用的技术能力放在
`src/shared`，业务规则仍由对应限界上下文持有。
