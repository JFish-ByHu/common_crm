<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Check, Close, Refresh } from '@element-plus/icons-vue'
import type { ElTree } from 'element-plus'
import { Message, Notification } from '@common-crm/utils'
import type { MenuItem, RolePermissions } from '@common-crm/types/api'
import {
  ApiError,
  assignRolePermissions,
  queryRolePermissions,
  queryRolePermissionTree,
  refreshAuthorization
} from '../../../services'
import type { RoleListItem } from '../types'

interface PermissionNode {
  id: string
  label: string
  kind: 'menu' | 'action'
  disabled: boolean
  children?: PermissionNode[]
}
const visible = defineModel<boolean>({ default: false })
const props = defineProps<{ role: RoleListItem | null }>()
const treeRef = ref<InstanceType<typeof ElTree>>()
const menus = ref<MenuItem[]>([])
const permissions = ref<RolePermissions | null>(null)
const loading = ref(false)
const saving = ref(false)
const loaded = ref(false)
const keyword = ref('')
let controller: AbortController | undefined
let settingKeys = false
const nodes = computed(() => {
  const convert = (items: MenuItem[]): PermissionNode[] =>
    items.map(menu => ({
      id: menu.menuId,
      label: `${menu.name}${menu.enabled ? '' : '（停用）'}`,
      kind: 'menu',
      disabled: !!permissions.value?.isSystem,
      children: [
        ...convert(menu.children),
        ...menu.actions.map(action => ({
          id: action.actionId,
          label: `${action.name} · ${action.permissionCode}${action.enabled ? '' : '（停用）'}`,
          kind: 'action' as const,
          disabled: !!permissions.value?.isSystem
        }))
      ]
    }))
  return convert(menus.value)
})
const reportFailure = (error: unknown) =>
  Notification.error({
    title: '权限配置失败',
    message: error instanceof ApiError ? error.message : '请求失败，请重试'
  })
const loadPermissions = async () => {
  if (!props.role) return
  controller?.abort()
  const request = new AbortController()
  controller = request
  loaded.value = false
  loading.value = true
  try {
    const [tree, grants] = await Promise.all([
      queryRolePermissionTree({ signal: request.signal }),
      queryRolePermissions(props.role.roleId, { signal: request.signal })
    ])
    if (request.signal.aborted) return
    menus.value = tree.data ?? []
    permissions.value = grants.data
    await nextTick()
    const allIds = (items: PermissionNode[]): string[] =>
      items.flatMap(item => [item.id, ...allIds(item.children ?? [])])
    settingKeys = true
    treeRef.value?.setCheckedKeys(
      grants.data?.isSystem
        ? allIds(nodes.value)
        : [...(grants.data?.menuIds ?? []), ...(grants.data?.actionIds ?? [])]
    )
    await nextTick()
    settingKeys = false
    loaded.value = !!grants.data
  } catch (error) {
    if (!request.signal.aborted) reportFailure(error)
  } finally {
    if (controller === request) loading.value = false
  }
}
const filterNode = (value: string, node: PermissionNode) =>
  !value || node.label.toLowerCase().includes(value.toLowerCase())
watch(keyword, value => treeRef.value?.filter(value))
watch(visible, open => {
  if (open) {
    keyword.value = ''
    void loadPermissions()
  } else {
    controller?.abort()
    loaded.value = false
  }
})
// Strict checking avoids granting every button when only its parent page is checked.
const selectNode = (node: PermissionNode, checked: boolean) => {
  if (settingKeys) return
  const current = treeRef.value?.getNode(node.id)
  if (!current) return
  if (checked) {
    let parent = current.parent
    while (parent?.data?.id) {
      treeRef.value?.setChecked(parent.data.id, true, false)
      parent = parent.parent
    }
  } else {
    const clear = (children: PermissionNode[]) =>
      children.forEach(child => {
        treeRef.value?.setChecked(child.id, false, false)
        clear(child.children ?? [])
      })
    clear(node.children ?? [])
  }
}
const savePermissions = async () => {
  if (!loaded.value || saving.value || !permissions.value || permissions.value.isSystem) return
  saving.value = true
  const selected = (treeRef.value?.getCheckedNodes() ?? []) as PermissionNode[]
  try {
    await assignRolePermissions({
      roleId: permissions.value.roleId,
      revision: permissions.value.revision,
      menuIds: selected.filter(node => node.kind === 'menu').map(node => node.id),
      actionIds: selected.filter(node => node.kind === 'action').map(node => node.id)
    })
    await refreshAuthorization()
    visible.value = false
    await nextTick()
    Message.success('角色权限已更新')
  } catch (error) {
    reportFailure(error)
  } finally {
    saving.value = false
  }
}
onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="`${role?.roleName ?? ''} · 分配权限`"
    size="min(640px, 100vw)"
    :close-on-click-modal="false"
    :close-on-press-escape="!saving"
    :show-close="!saving"
    destroy-on-close
  >
    <el-tag v-if="permissions?.isSystem" type="warning" class="system-role"
      >系统管理角色 · 全部权限</el-tag
    >
    <div class="permission-toolbar">
      <el-input
        v-model="keyword"
        clearable
        placeholder="检索菜单或按钮"
        aria-label="检索菜单或按钮"
      /><el-tooltip content="重新加载"
        ><el-button
          :icon="Refresh"
          :disabled="saving"
          :loading="loading"
          aria-label="重新加载权限"
          @click="loadPermissions"
      /></el-tooltip>
    </div>
    <div v-loading="loading || saving">
      <el-tree
        ref="treeRef"
        :data="nodes"
        node-key="id"
        show-checkbox
        check-strictly
        default-expand-all
        :filter-node-method="filterNode"
        :props="{ label: 'label', children: 'children', disabled: 'disabled' }"
        @check-change="selectNode"
      />
    </div>
    <template #footer
      ><el-button :icon="Close" :disabled="saving" @click="visible = false">取消</el-button
      ><el-button
        type="primary"
        :icon="Check"
        :disabled="!loaded || loading || permissions?.isSystem"
        :loading="saving"
        @click="savePermissions"
        >保存</el-button
      ></template
    >
  </el-drawer>
</template>

<style scoped>
.permission-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.system-role {
  margin-bottom: 16px;
}
:deep(.el-tree-node__content) {
  height: auto;
  min-height: 34px;
}
:deep(.el-tree-node__label) {
  white-space: normal;
  overflow-wrap: anywhere;
  padding: 5px 0;
}
</style>
