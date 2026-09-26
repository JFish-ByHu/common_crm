import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Message, notifyRequestError } from '@common-crm/utils'
import {
  ApiError,
  authorization,
  createMenu,
  createMenuAction,
  deleteMenu,
  deleteMenuAction,
  queryMenuTree,
  queryPermissionEndpoints,
  refreshAuthorization,
  updateMenu,
  updateMenuAction
} from '../../../services'
import type {
  ApiPermissionRule,
  MenuActionInput,
  MenuActionItem,
  MenuFilters,
  MenuInput,
  MenuItem
} from '../types'
import { batchDeleteMenus } from '../../../services'

export const useMenus = () => {
  const menus = ref<MenuItem[]>([])
  const filters = ref<MenuFilters>({ keyword: '' })
  const appliedKeyword = ref('')
  const filteredMenus = computed(() => {
    const text = appliedKeyword.value.trim().toLowerCase()
    const filterMenus = (nodes: MenuItem[]): MenuItem[] =>
      nodes.flatMap(menu => {
        if (
          !text ||
          `${menu.name} ${menu.permissionCode} ${menu.routePath ?? ''}`.toLowerCase().includes(text)
        )
          return [menu]
        const children = filterMenus(menu.children)
        return children.length ? [{ ...menu, children }] : []
      })
    return filterMenus(menus.value)
  })
  const selectedMenus = ref<MenuItem[]>([])
  const endpoints = ref<ApiPermissionRule[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const editorVisible = ref(false)
  const editingMenu = ref<MenuItem | null>(null)
  const parentId = ref<string | null>(null)
  const actionDrawerVisible = ref(false)
  const actionMenuId = ref<string | null>(null)
  const actionMenu = computed(
    () => flattenMenus(menus.value).find(menu => menu.menuId === actionMenuId.value) ?? null
  )
  const actionEditorVisible = ref(false)
  const editingAction = ref<MenuActionItem | null>(null)
  let disposed = false
  let request: AbortController | undefined
  let confirming = false
  const can = authorization.hasPermission
  const reportFailure = (error: unknown) =>
    notifyRequestError(error, {
      title: '操作失败',
      message: error instanceof ApiError ? error.message : '请求失败，请稍后重试'
    })

  const refreshMenus = async () => {
    request?.abort()
    const controller = new AbortController()
    request = controller
    loading.value = true
    try {
      const [tree, rules] = await Promise.all([
        queryMenuTree({ signal: controller.signal }),
        queryPermissionEndpoints({ signal: controller.signal })
      ])
      if (disposed || controller.signal.aborted) return false
      menus.value = tree.data ?? []
      selectedMenus.value = []
      endpoints.value = rules.data ?? []
      return true
    } catch (error) {
      if (!disposed && !controller.signal.aborted) reportFailure(error)
      return false
    } finally {
      if (request === controller) loading.value = false
    }
  }
  const openMenu = (menu: MenuItem | null = null, parent: string | null = null) => {
    editingMenu.value = menu
    parentId.value = menu?.parentId ?? parent
    editorVisible.value = true
  }
  const searchMenus = () => {
    if (loading.value || saving.value) return
    appliedKeyword.value = filters.value.keyword
    return refreshMenus()
  }
  const resetMenuFilters = () => {
    if (loading.value || saving.value) return
    filters.value = { keyword: '' }
    return searchMenus()
  }
  const openActions = (menu: MenuItem) => {
    actionMenuId.value = menu.menuId
    actionDrawerVisible.value = true
  }
  const openAction = (action: MenuActionItem | null = null) => {
    editingAction.value = action
    actionEditorVisible.value = true
  }

  const performMutation = async (
    operation: () => Promise<unknown>,
    message: string,
    close?: () => void
  ) => {
    if (saving.value || disposed) return
    saving.value = true
    try {
      await operation()
      if (disposed) return
      close?.()
      await refreshAuthorization()
      if (await refreshMenus()) {
        await nextTick()
        Message.success(message)
      }
    } catch (error) {
      if (!disposed) reportFailure(error)
    } finally {
      saving.value = false
    }
  }
  const saveMenu = (input: MenuInput) =>
    performMutation(
      () =>
        editingMenu.value
          ? updateMenu({ ...input, menuId: editingMenu.value.menuId })
          : createMenu(input),
      '菜单已保存',
      () => {
        editorVisible.value = false
      }
    )
  const saveAction = (input: MenuActionInput) =>
    performMutation(
      () =>
        editingAction.value
          ? updateMenuAction({ ...input, actionId: editingAction.value.actionId })
          : createMenuAction(input),
      '按钮权限已保存',
      () => {
        actionEditorVisible.value = false
      }
    )
  const confirmDelete = async (name: string, operation: () => Promise<unknown>) => {
    if (confirming || saving.value) return
    confirming = true
    try {
      await ElMessageBox.confirm(`确定删除“${name}”吗？相关角色授权将一并移除。`, '删除确认', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      })
      if (!disposed) await performMutation(operation, '已删除')
    } catch (error) {
      if (error !== 'cancel' && error !== 'close') reportFailure(error)
    } finally {
      confirming = false
    }
  }
  const removeMenu = (menu: MenuItem) => confirmDelete(menu.name, () => deleteMenu(menu.menuId))
  const removeSelectedMenus = () =>
    selectedMenus.value.length
      ? confirmDelete(`选中的 ${selectedMenus.value.length} 个菜单`, () =>
          batchDeleteMenus(selectedMenus.value.map(menu => menu.menuId))
        )
      : undefined
  const removeAction = (action: MenuActionItem) =>
    confirmDelete(action.name, () => deleteMenuAction(action.actionId))
  onMounted(refreshMenus)
  onBeforeUnmount(() => {
    disposed = true
    request?.abort()
  })
  return {
    menus,
    filters,
    filteredMenus,
    searchMenus,
    resetMenuFilters,
    selectedMenus,
    removeSelectedMenus,
    endpoints,
    loading,
    saving,
    editorVisible,
    editingMenu,
    parentId,
    actionDrawerVisible,
    actionMenu,
    actionEditorVisible,
    editingAction,
    can,
    refreshMenus,
    openMenu,
    openActions,
    openAction,
    saveMenu,
    saveAction,
    removeMenu,
    removeAction
  }
}

export const flattenMenus = (menus: MenuItem[]): MenuItem[] =>
  menus.flatMap(menu => [menu, ...flattenMenus(menu.children)])
