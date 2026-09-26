import { defineError } from './types.js'

export const RoleErrors = Object.freeze({
  ROLE_NOT_FOUND: defineError(130001, 404, '角色不存在，请刷新后重试'),
  ROLE_CONFLICT: defineError(130002, 409, '角色编码已存在'),
  ROLE_IN_USE: defineError(130003, 409, '角色已分配给用户，请先解除分配后再删除'),
  ROLE_DISABLED: defineError(130004, 409, '不能新增分配停用的角色，请刷新后重试'),
  INVALID_INPUT: defineError(130005, 400, '角色参数无效或没有可更新的字段'),
  SYSTEM_ROLE_IMMUTABLE: defineError(130006, 403, '系统管理角色不可修改'),
  SYSTEM_ROLE_UNDELETABLE: defineError(130007, 403, '系统管理角色不可删除'),
  SYSTEM_ROLE_MEMBERS_PROTECTED: defineError(130008, 403, '系统管理角色成员不可通过业务接口调整')
})
