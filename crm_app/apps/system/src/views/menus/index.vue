<script setup lang="ts">
definePage({ key: 'system-menus', title: '菜单管理', defaultPath: '/system/menus' })

import { computed } from 'vue'
import { Delete, Edit, Key, Plus } from '@element-plus/icons-vue'
import { CrmFilterBar } from '@common-crm/components'
import { ActionEditor, MenuActions, MenuEditor, MenuToolbar } from './components'
import { menuFilterFields } from './config'
import { useMenus } from './hooks'
import type { MenuItem } from './types'

const {
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
  openMenu,
  openActions,
  openAction,
  saveMenu,
  saveAction,
  removeMenu,
  removeAction
} = useMenus()
const selectMenus = (rows: MenuItem[]) => {
  selectedMenus.value = rows
}
const busy = computed(() => loading.value || saving.value)
</script>

<template>
  <section class="menu-management" aria-label="菜单管理">
    <CrmFilterBar
      v-model="filters"
      :fields="menuFilterFields"
      :loading="busy"
      @search="searchMenus"
      @reset="resetMenuFilters"
    />
    <MenuToolbar
      :can-create="can('system:menus:create')"
      :can-delete="can('system:menus:batchDelete')"
      :selected-count="selectedMenus.length"
      :disabled="busy"
      @create="openMenu()"
      @delete-selected="removeSelectedMenus"
    />
    <el-table
      v-loading="loading || saving"
      class="menu-table"
      :data="filteredMenus"
      row-key="menuId"
      border
      default-expand-all
      @selection-change="selectMenus"
    >
      <el-table-column v-if="can('system:menus:batchDelete')" type="selection" width="48" />
      <el-table-column prop="name" label="菜单名称" min-width="190" />
      <el-table-column label="类型" width="85"
        ><template #default="{ row }"
          ><el-tag :type="row.menuType === 'DIRECTORY' ? 'info' : 'primary'">{{
            row.menuType === 'DIRECTORY' ? '目录' : '页面'
          }}</el-tag></template
        ></el-table-column
      >
      <el-table-column
        prop="permissionCode"
        label="权限标识"
        min-width="180"
        show-overflow-tooltip
      />
      <el-table-column prop="routePath" label="路由路径" min-width="170" show-overflow-tooltip />
      <el-table-column prop="sortOrder" label="排序" width="75" />
      <el-table-column label="导航" width="80"
        ><template #default="{ row }">{{
          row.visible ? '显示' : '隐藏'
        }}</template></el-table-column
      >
      <el-table-column label="状态" width="80"
        ><template #default="{ row }"
          ><el-tag :type="row.enabled ? 'success' : 'danger'">{{
            row.enabled ? '启用' : '停用'
          }}</el-tag></template
        ></el-table-column
      >
      <el-table-column label="操作" fixed="right" width="140" align="center"
        ><template #default="{ row }">
          <el-tooltip v-if="can('system:menus:edit')" content="编辑菜单"
            ><el-button
              link
              type="primary"
              :icon="Edit"
              :disabled="saving"
              aria-label="编辑菜单"
              @click="openMenu(row)"
          /></el-tooltip>
          <el-tooltip
            v-if="row.menuType === 'DIRECTORY' && can('system:menus:create')"
            content="新增子菜单"
            ><el-button
              link
              type="primary"
              :icon="Plus"
              :disabled="saving"
              aria-label="新增子菜单"
              @click="openMenu(null, row.menuId)"
          /></el-tooltip>
          <el-tooltip v-if="row.menuType === 'PAGE'" content="按钮权限"
            ><el-button
              link
              type="primary"
              :icon="Key"
              :disabled="saving"
              aria-label="按钮权限"
              @click="openActions(row)"
          /></el-tooltip>
          <el-tooltip v-if="can('system:menus:delete')" content="删除菜单"
            ><el-button
              link
              type="danger"
              :icon="Delete"
              :disabled="saving"
              aria-label="删除菜单"
              @click="removeMenu(row)"
          /></el-tooltip> </template
      ></el-table-column>
    </el-table>
    <MenuEditor
      v-model="editorVisible"
      :menu="editingMenu"
      :menus="menus"
      :parent-id="parentId"
      :saving="saving"
      @save="saveMenu"
    />
    <MenuActions
      v-model="actionDrawerVisible"
      :menu="actionMenu"
      :saving="saving"
      @create="openAction()"
      @edit="openAction"
      @delete="removeAction"
    />
    <ActionEditor
      v-model="actionEditorVisible"
      :menu="actionMenu"
      :action="editingAction"
      :menus="menus"
      :endpoints="endpoints"
      :saving="saving"
      @save="saveAction"
    />
  </section>
</template>

<style scoped>
.menu-management {
  padding: 24px;
  min-width: 0;
  min-height: calc(100vh - 64px);
  background: var(--crm-color-surface);
}
.menu-table {
  box-shadow: var(--el-box-shadow-lighter);
}
@media (max-width: 720px) {
  .menu-management {
    padding: 16px;
  }
}
</style>
