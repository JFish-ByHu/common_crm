import { nextTick, onBeforeUnmount, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Message, notifyRequestError } from '@common-crm/utils'
import {
  ApiError,
  batchDeleteRoles,
  createRole,
  deleteRole,
  updateRole,
  updateRoleStatus,
  refreshAuthorization
} from '../../../services'
import type { RoleFormValues, RoleListItem } from '../types'

export const useRoleActions = (refreshRoleList: () => Promise<boolean>) => {
  const editorVisible = ref(false)
  const editingRole = ref<RoleListItem | null>(null)
  const saving = ref(false)
  const mutating = ref(false)
  const confirming = ref(false)
  let disposed = false
  onBeforeUnmount(() => {
    disposed = true
  })

  const reportFailure = (error: unknown) =>
    notifyRequestError(error, {
      title: '操作失败',
      message: error instanceof ApiError ? error.message : '操作失败，请稍后重试'
    })
  const openCreateRole = () => {
    editingRole.value = null
    editorVisible.value = true
  }
  const openEditRole = (role: RoleListItem) => {
    editingRole.value = role
    editorVisible.value = true
  }
  const saveRole = async (values: RoleFormValues) => {
    if (disposed || saving.value || mutating.value || confirming.value) return
    saving.value = true
    const role = editingRole.value
    let refreshed = false
    try {
      const profile = {
        roleName: values.roleName.trim(),
        roleStatus: values.roleStatus,
        remark: values.remark.trim() || null
      }
      if (role) await updateRole({ roleId: role.roleId, ...profile })
      else await createRole({ roleCode: values.roleCode.trim(), ...profile })
      if (disposed) return
      editorVisible.value = false
      await refreshAuthorization()
      refreshed = await refreshRoleList()
    } catch (error) {
      if (!disposed) reportFailure(error)
    } finally {
      saving.value = false
    }
    if (!refreshed || disposed) return
    await nextTick()
    if (!disposed) Message.success(role ? '角色已更新' : '角色已创建')
  }

  const confirmRoleMutation = async (
    title: string,
    message: string,
    operation: () => Promise<unknown>,
    success: string
  ) => {
    if (disposed || saving.value || mutating.value || confirming.value) return
    confirming.value = true
    let refreshed = false
    try {
      await ElMessageBox.confirm(message, title, {
        type: 'warning',
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        closeOnClickModal: false
      })
      if (disposed) return
      confirming.value = false
      mutating.value = true
      await operation()
      await refreshAuthorization()
      if (!disposed) refreshed = await refreshRoleList()
    } catch (error) {
      if (error !== 'cancel' && error !== 'close' && !disposed) reportFailure(error)
    } finally {
      confirming.value = false
      mutating.value = false
    }
    if (!refreshed || disposed) return
    await nextTick()
    if (!disposed) Message.success(success)
  }
  const changeRoleStatus = async (role: RoleListItem): Promise<boolean> => {
    const roleStatus = role.roleStatus === 1 ? 0 : 1
    const action = roleStatus === 1 ? '启用' : '停用'
    await confirmRoleMutation(
      `${action}角色`,
      `确定${action}角色“${role.roleName}”吗？`,
      () => updateRoleStatus({ roleId: role.roleId, roleStatus }),
      `角色已${action}`
    )
    return false
  }
  const deleteSelectedRole = (role: RoleListItem) =>
    confirmRoleMutation(
      '删除角色',
      `确定删除角色“${role.roleName}”吗？已分配的角色需先解除用户关联。`,
      () => deleteRole({ roleId: role.roleId }),
      '角色已删除'
    )
  const deleteSelectedRoles = (roles: RoleListItem[]) => {
    if (!roles.length) return
    return confirmRoleMutation(
      '批量删除角色',
      `确定删除选中的 ${roles.length} 个角色吗？任一角色仍有成员时整批取消。`,
      () => batchDeleteRoles({ roleIds: roles.map(role => role.roleId) }),
      `已删除 ${roles.length} 个角色`
    )
  }
  return {
    editorVisible,
    editingRole,
    saving,
    mutating,
    openCreateRole,
    openEditRole,
    saveRole,
    changeRoleStatus,
    deleteSelectedRole,
    deleteSelectedRoles
  }
}
