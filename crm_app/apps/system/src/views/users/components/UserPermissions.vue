<script setup lang="ts">
import { computed } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import type {
  UserListItem,
  UserPermissionMenu,
  UserPermissionsResponse,
  RoleSelectItem
} from '../types'

const visible = defineModel<boolean>({ default: false })
const props = defineProps<{
  user: UserListItem | null
  permissions: UserPermissionsResponse | null
  loading: boolean
}>()
const emit = defineEmits<{ refresh: [] }>()
interface PermissionNode {
  id: string
  label: string
  kind: string
  permissionCode: string
  sourceRoles: RoleSelectItem[]
  children: PermissionNode[]
}
const toNodes = (menus: UserPermissionMenu[]): PermissionNode[] =>
  menus.map(menu => ({
    id: menu.menuId,
    label: menu.name,
    kind: menu.menuType === 'DIRECTORY' ? '目录' : '页面',
    permissionCode: menu.permissionCode,
    sourceRoles: menu.sourceRoles,
    children: [
      ...toNodes(menu.children),
      ...menu.actions.map(action => ({
        id: action.actionId,
        label: action.name,
        kind: '按钮',
        permissionCode: action.permissionCode,
        sourceRoles: action.sourceRoles,
        children: []
      }))
    ]
  }))
const nodes = computed(() => toNodes(props.permissions?.menus ?? []))
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="`${permissions?.username ?? user?.username ?? ''} · 查看权限`"
    size="min(760px, 100vw)"
    append-to-body
    destroy-on-close
  >
    <div v-loading="loading" class="permission-body" :aria-busy="loading">
      <template v-if="permissions">
        <el-descriptions :column="1" :border="false" :label-width="90" class="permission-summary">
          <el-descriptions-item label="用户ID">{{ permissions.userId }}</el-descriptions-item>
          <el-descriptions-item label="账号状态">{{
            permissions.accountStatus === 1 ? '正常' : '停用'
          }}</el-descriptions-item>
          <el-descriptions-item label="所属角色">{{
            permissions.roles
              .map(role => `${role.roleName}${role.roleStatus === 0 ? '（停用）' : ''}`)
              .join('、') || '-'
          }}</el-descriptions-item>
          <el-descriptions-item label="权限范围">{{
            permissions.isSuperAdmin
              ? '全部权限（含后续新增权限）'
              : permissions.accountStatus === 0
                ? '账号已停用，当前无有效权限'
                : '启用角色的有效权限合并'
          }}</el-descriptions-item>
        </el-descriptions>
        <template v-if="permissions.isSuperAdmin">
          <el-alert
            title="平台管理员拥有全部权限"
            description="包括后续新增的业务接口；无需逐项分配。下方展示当前启用的菜单与按钮配置。"
            type="info"
            show-icon
            :closable="false"
          />
        </template>
        <p v-else class="permission-hint">
          停用角色、停用菜单及其下级、停用按钮不计入有效权限。仅隐藏导航的菜单仍保留访问权限。
        </p>
        <div class="permission-heading">
          <h3>有效菜单与按钮</h3>
          <el-button :icon="Refresh" :disabled="loading" @click="emit('refresh')"
            >刷新权限</el-button
          >
        </div>
        <el-tree
          v-if="nodes.length"
          :data="nodes"
          node-key="id"
          default-expand-all
          :expand-on-click-node="false"
          class="permission-tree"
        >
          <template #default="{ data }">
            <div class="permission-node">
              <div class="permission-label">
                <el-tag size="small" type="info">{{ data.kind }}</el-tag
                ><span>{{ data.label }}</span>
              </div>
              <code>{{ data.permissionCode }}</code>
              <span class="permission-source"
                >来源：{{
                  data.sourceRoles.map((role: RoleSelectItem) => role.roleName).join('、') || '—'
                }}</span
              >
            </div>
          </template>
        </el-tree>
        <el-empty
          v-else
          :description="permissions.accountStatus === 0 ? '账号已停用' : '暂无有效菜单或按钮权限'"
        />
      </template>
      <el-empty v-else-if="!loading" description="权限信息加载失败">
        <el-button type="primary" :icon="Refresh" @click="emit('refresh')">重新加载</el-button>
      </el-empty>
    </div>
  </el-drawer>
</template>

<style scoped>
.permission-body {
  min-height: 200px;
}
.permission-summary :deep(.el-descriptions__content) {
  overflow-wrap: anywhere;
}
.permission-summary :deep(.el-descriptions__table) {
  table-layout: fixed;
  width: 100%;
}
.permission-summary :deep(.el-descriptions__label) {
  width: 90px;
  min-width: 90px;
  box-sizing: border-box;
  vertical-align: top;
}
.permission-summary :deep(.el-descriptions__content) {
  min-width: 0;
  vertical-align: top;
}
.permission-heading,
.permission-label {
  display: flex;
  align-items: center;
  gap: 8px;
}
.permission-heading {
  justify-content: space-between;
  margin: 24px 0 12px;
  flex-wrap: wrap;
}
.permission-heading h3 {
  margin: 0;
  font-size: 16px;
}
.permission-hint,
.permission-source {
  color: var(--el-text-color-regular);
  line-height: 1.6;
}
.permission-tree :deep(.el-tree-node__content) {
  height: auto;
  align-items: flex-start;
  padding-block: 8px;
}
.permission-tree :deep(.el-tree-node__expand-icon) {
  margin-top: 2px;
}
.permission-node {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
  padding-right: 8px;
  white-space: normal;
  overflow-wrap: anywhere;
}
.permission-label {
  flex-wrap: wrap;
}
.permission-node code {
  color: var(--el-text-color-regular);
  font-size: 13px;
}
.permission-source {
  font-size: 13px;
}
</style>
