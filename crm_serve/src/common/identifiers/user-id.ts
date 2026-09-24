import { randomUUID } from 'node:crypto'

/** 普通用户 ID；仅在创建账号时生成，编辑资料时保持不变。 */
export const createUserId = (): string => `crm_user_${randomUUID()}`

/** 管理员账号初始化使用；ID 前缀不代表角色或访问权限。 */
export const createAdminUserId = (): string => `crm_admin_${randomUUID()}`
