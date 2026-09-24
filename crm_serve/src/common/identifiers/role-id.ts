import { randomUUID } from 'node:crypto'

/** 角色 ID 在创建后保持稳定。 */
export const createRoleId = (): string => `crm_role_${randomUUID()}`
