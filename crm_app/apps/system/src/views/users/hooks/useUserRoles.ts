import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Message, notifyRequestError } from '@common-crm/utils'
import {
  ApiError,
  assignUserRoles,
  isRequestCanceled,
  queryRoleSelectList,
  queryUserRoles,
  refreshAuthorization
} from '../../../services'
import type { RoleSelectItem } from '@common-crm/types/api'
import type { UserListItem } from '../types'

export const useUserRoles = (onRolesSaved: (userId: string, roles: RoleSelectItem[]) => void) => {
  const roleEditorVisible = ref(false)
  const roleUser = ref<UserListItem | null>(null)
  const roleOptions = ref<RoleSelectItem[]>([])
  const assignedRoleIds = ref<string[]>([])
  const selectedRoleIds = ref<string[]>([])
  const rolesLoading = ref(false)
  const rolesSaving = ref(false)
  const rolesLoaded = ref(false)
  let controller: AbortController | undefined
  let disposed = false

  const loadUserRoles = async () => {
    const user = roleUser.value
    if (disposed || !user || !roleEditorVisible.value || rolesSaving.value) return
    controller?.abort()
    const request = new AbortController()
    controller = request
    rolesLoading.value = true
    rolesLoaded.value = false
    roleOptions.value = []
    assignedRoleIds.value = []
    selectedRoleIds.value = []
    try {
      const [options, assigned] = await Promise.all([
        queryRoleSelectList({}, { signal: request.signal }),
        queryUserRoles(user.userId, { signal: request.signal })
      ])
      if (request.signal.aborted || controller !== request) return
      if (!options.data || !assigned.data) throw new Error('用户角色响应为空')
      // 查询期间可能创建或停用角色，以已分配结果补齐选项，避免保存时误删关联。
      const available = new Map(options.data.list.map(role => [role.roleId, role]))
      assigned.data.roles.forEach(role => available.set(role.roleId, role))
      roleOptions.value = [...available.values()]
      assignedRoleIds.value = assigned.data.roles.map(role => role.roleId)
      selectedRoleIds.value = [...assignedRoleIds.value]
      rolesLoaded.value = true
    } catch (error) {
      if (!request.signal.aborted && !isRequestCanceled(error)) {
        request.abort()
        notifyRequestError(error, {
          title: '请求失败',
          message: error instanceof ApiError ? error.message : '用户角色加载失败，请稍后重试'
        })
      }
    } finally {
      if (controller === request) rolesLoading.value = false
    }
  }

  const openUserRoles = (user: UserListItem) => {
    if (disposed || rolesSaving.value) return
    roleUser.value = user
    roleEditorVisible.value = true
    void loadUserRoles()
  }
  const saveUserRoles = async () => {
    const user = roleUser.value
    if (
      disposed ||
      !user ||
      !roleEditorVisible.value ||
      !rolesLoaded.value ||
      rolesLoading.value ||
      rolesSaving.value
    )
      return
    rolesSaving.value = true
    let saved = false
    try {
      const { data } = await assignUserRoles({
        userId: user.userId,
        roleIds: [...selectedRoleIds.value]
      })
      if (disposed) return
      if (!data) throw new Error('分配角色响应为空')
      onRolesSaved(data.userId, data.roles)
      assignedRoleIds.value = data.roles.map(role => role.roleId)
      selectedRoleIds.value = [...assignedRoleIds.value]
      roleEditorVisible.value = false
      await refreshAuthorization()
      saved = true
    } catch (error) {
      if (!disposed)
        notifyRequestError(error, {
          title: '分配失败',
          message: error instanceof ApiError ? error.message : '角色分配失败，请稍后重试'
        })
    } finally {
      rolesSaving.value = false
    }
    if (!saved || disposed) return
    await nextTick()
    if (!disposed) Message.success('用户角色已更新')
  }

  watch(roleEditorVisible, visible => {
    if (!visible) controller?.abort()
  })
  onBeforeUnmount(() => {
    disposed = true
    controller?.abort()
  })
  return {
    roleEditorVisible,
    roleUser,
    roleOptions,
    assignedRoleIds,
    selectedRoleIds,
    rolesLoading,
    rolesSaving,
    rolesLoaded,
    openUserRoles,
    loadUserRoles,
    saveUserRoles
  }
}
