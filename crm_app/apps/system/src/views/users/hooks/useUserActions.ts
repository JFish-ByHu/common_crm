import { nextTick, onBeforeUnmount, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import {
  batchDeleteUsers,
  createUser,
  deleteUser,
  updateUser,
  updateUserAccountStatus
} from '../../../services'
import { Message } from '@common-crm/utils'
import type { UserFormValues, UserListItem } from '../types'
import { getUserErrorMessage } from '../utils'

export const useUserActions = (refreshUserList: () => Promise<boolean>) => {
  const editorVisible = ref(false)
  const editingUser = ref<UserListItem | null>(null)
  const saving = ref(false)
  const confirming = ref(false)
  const mutating = ref(false)
  const saveError = ref('')
  let disposed = false

  onBeforeUnmount(() => {
    disposed = true
  })

  const openCreateUser = () => {
    editingUser.value = null
    saveError.value = ''
    editorVisible.value = true
  }

  const openEditUser = (user: UserListItem) => {
    editingUser.value = user
    saveError.value = ''
    editorVisible.value = true
  }

  const saveUser = async (values: UserFormValues) => {
    if (saving.value || confirming.value || mutating.value || disposed) return
    saving.value = true
    saveError.value = ''
    const user = editingUser.value
    let refreshed = false

    try {
      const profile = { username: values.username.trim(), email: values.email.trim() || null }
      if (user) {
        await updateUser({
          ...profile,
          userId: user.userId,
          ...(values.password ? { password: values.password } : {})
        })
      } else {
        await createUser({
          ...profile,
          password: values.password,
          accountStatus: values.accountStatus
        })
      }
      if (disposed) return
      editorVisible.value = false
      refreshed = await refreshUserList()
    } catch (error) {
      if (!disposed) saveError.value = getUserErrorMessage(error, '保存用户失败，请稍后重试')
    } finally {
      saving.value = false
    }
    if (!refreshed || disposed) return
    await nextTick()
    if (!disposed) Message.success(user ? '用户已更新' : '用户已创建')
  }

  const confirmUserMutation = async (
    title: string,
    message: string,
    operation: () => Promise<unknown>,
    successMessage: string
  ): Promise<boolean> => {
    if (confirming.value || mutating.value || saving.value || disposed) return false
    confirming.value = true
    let refreshed = false
    try {
      await ElMessageBox.confirm(message, title, {
        type: 'warning',
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        closeOnClickModal: false
      })
      if (disposed) return false
      confirming.value = false
      mutating.value = true
      await operation()
      if (disposed) return false
      refreshed = await refreshUserList()
    } catch (error) {
      if (error !== 'cancel' && error !== 'close' && !disposed) {
        Message.error(getUserErrorMessage(error, '操作失败，请稍后重试'))
      }
      return false
    } finally {
      confirming.value = false
      mutating.value = false
    }
    if (!refreshed || disposed) return false
    await nextTick()
    if (disposed) return false
    Message.success(successMessage)
    return true
  }

  const changeUserStatus = async (user: UserListItem): Promise<boolean> => {
    const accountStatus = user.accountStatus === 1 ? 0 : 1
    const action = accountStatus === 1 ? '启用' : '停用'
    const message =
      accountStatus === 0
        ? `确定停用用户“${user.username}”吗？该用户的登录会话将立即失效。`
        : `确定启用用户“${user.username}”吗？`
    await confirmUserMutation(
      `${action}用户`,
      message,
      () => updateUserAccountStatus({ userId: user.userId, accountStatus }),
      `用户已${action}`
    )
    // 刷新后的服务端数据已更新开关，阻止 before-change 再次翻转状态。
    return false
  }

  const deleteSelectedUser = (user: UserListItem) => {
    return confirmUserMutation(
      '删除用户',
      `确定删除用户“${user.username}”吗？删除后无法恢复，该用户的登录会话也将失效。`,
      () => deleteUser({ userId: user.userId }),
      '用户已删除'
    )
  }

  const deleteSelectedUsers = (users: UserListItem[]) => {
    const userIds = users.map(user => user.userId)
    if (!userIds.length) return Promise.resolve(false)
    return confirmUserMutation(
      '批量删除用户',
      `确定删除选中的 ${userIds.length} 位用户吗？删除后无法恢复，这些用户的登录会话也将失效。`,
      () => batchDeleteUsers({ userIds }),
      `已删除 ${userIds.length} 位用户`
    )
  }

  return {
    editorVisible,
    editingUser,
    saving,
    mutating,
    saveError,
    openCreateUser,
    openEditUser,
    saveUser,
    changeUserStatus,
    deleteSelectedUser,
    deleteSelectedUsers
  }
}
