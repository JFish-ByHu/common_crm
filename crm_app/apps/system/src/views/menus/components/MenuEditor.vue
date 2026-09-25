<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { Check, Close } from '@element-plus/icons-vue'
import * as Icons from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { pageCatalog } from 'virtual:crm-pages/catalog'
import { isPageRoutePath } from '@common-crm/router'
import type { MenuInput, MenuItem } from '../types'
import { flattenMenus } from '../hooks'

const visible = defineModel<boolean>({ default: false })
const props = defineProps<{
  menu: MenuItem | null
  menus: MenuItem[]
  parentId: string | null
  saving: boolean
}>()
const emit = defineEmits<{ save: [input: MenuInput] }>()
const formRef = ref<FormInstance>()
const form = reactive<MenuInput>({
  parentId: null,
  menuType: 'PAGE',
  name: '',
  permissionCode: '',
  routePath: '',
  componentKey: null,
  icon: null,
  sortOrder: 0,
  visible: true,
  enabled: true
})
const iconNames = Object.keys(Icons)
const parents = computed(() => {
  const excluded = new Set(props.menu ? flattenMenus([props.menu]).map(menu => menu.menuId) : [])
  return flattenMenus(props.menus).filter(
    menu => menu.menuType === 'DIRECTORY' && !excluded.has(menu.menuId)
  )
})
const rules: FormRules<MenuInput> = {
  name: [{ required: true, whitespace: true, message: '请输入名称', trigger: 'blur' }],
  permissionCode: [
    {
      required: true,
      pattern: /^[a-zA-Z][a-zA-Z0-9:_.-]{0,127}$/,
      message: '字母开头，可包含数字、冒号、下划线、点及连字符',
      trigger: 'blur'
    }
  ],
  componentKey: [
    {
      validator: (_rule, value, callback) =>
        callback(
          form.menuType === 'PAGE' && value && !pageCatalog.some(page => page.key === value)
            ? new Error('请选择已注册的页面组件，原组件可能已移除')
            : undefined
        ),
      trigger: 'change'
    }
  ],
  routePath: [
    {
      validator: (_rule, value: string, callback) => {
        const base = pageCatalog.find(page => page.key === form.componentKey)?.basePath
        callback(
          form.menuType === 'PAGE' &&
            value &&
            (!/^\/(system|customer)(\/|$)/.test(value) ||
              (base && !(value === base || value.startsWith(base + '/'))) ||
              !isPageRoutePath(value))
            ? new Error('请输入所属应用下的有效路由路径')
            : undefined
        )
      },
      trigger: 'blur'
    }
  ]
}
watch(visible, async open => {
  if (!open) return
  const menu = props.menu
  Object.assign(form, {
    parentId: props.parentId,
    menuType: menu?.menuType ?? 'PAGE',
    name: menu?.name ?? '',
    permissionCode: menu?.permissionCode ?? '',
    routePath: menu?.routePath ?? '',
    componentKey: menu?.componentKey ?? null,
    icon: menu?.icon ?? null,
    sortOrder: menu?.sortOrder ?? 0,
    visible: menu?.visible ?? true,
    enabled: menu?.enabled ?? true
  })
  await nextTick()
  formRef.value?.clearValidate()
})
const selectComponent = (key: string) => {
  const page = pageCatalog.find(item => item.key === key)
  if (page) {
    form.routePath = page.defaultPath
    form.visible = page.visible
    if (!form.name) form.name = page.title
  }
}
watch(
  () => form.routePath,
  path => {
    if (form.menuType === 'PAGE' && path?.includes(':')) form.visible = false
  }
)
const submitMenu = async () => {
  if (props.saving || !(await formRef.value?.validate().catch(() => false))) return
  if (form.menuType === 'PAGE' && form.routePath?.includes(':')) form.visible = false
  emit('save', {
    ...form,
    parentId: form.parentId || null,
    icon: form.icon || null,
    componentKey: form.menuType === 'PAGE' ? form.componentKey || null : null,
    routePath: form.menuType === 'PAGE' ? form.routePath || null : null
  })
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="menu ? '编辑菜单' : '新增菜单'"
    width="min(600px, calc(100vw - 32px))"
    :close-on-click-modal="false"
    :show-close="!saving"
    :close-on-press-escape="!saving"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      :disabled="saving"
      label-position="top"
      @submit.prevent="submitMenu"
    >
      <el-form-item label="菜单类型"
        ><el-radio-group v-model="form.menuType"
          ><el-radio-button value="DIRECTORY">目录</el-radio-button
          ><el-radio-button value="PAGE">页面</el-radio-button></el-radio-group
        ></el-form-item
      >
      <el-form-item label="上级目录"
        ><el-select v-model="form.parentId" clearable filterable placeholder="顶级菜单"
          ><el-option
            v-for="parent in parents"
            :key="parent.menuId"
            :value="parent.menuId"
            :label="parent.name" /></el-select
      ></el-form-item>
      <el-form-item label="菜单名称" prop="name"
        ><el-input v-model.trim="form.name" maxlength="64"
      /></el-form-item>
      <el-form-item label="权限标识" prop="permissionCode"
        ><el-input v-model.trim="form.permissionCode" maxlength="128"
      /></el-form-item>
      <template v-if="form.menuType === 'PAGE'">
        <el-form-item label="页面组件" prop="componentKey"
          ><el-select
            v-model="form.componentKey"
            clearable
            filterable
            placeholder="可选，暂不绑定页面可留空"
            @change="selectComponent"
            ><el-option
              v-if="form.componentKey && !pageCatalog.some(page => page.key === form.componentKey)"
              :value="form.componentKey"
              :label="`${form.componentKey}（组件不存在）`"
              disabled /><el-option
              v-for="page in pageCatalog"
              :key="page.key"
              :value="page.key"
              :label="`${page.title} (${page.key})`" /></el-select
        ></el-form-item>
        <el-form-item label="路由路径" prop="routePath"
          ><el-input
            v-model.trim="form.routePath"
            maxlength="255"
            clearable
            placeholder="可选，暂不绑定页面可留空"
        /></el-form-item>
      </template>
      <el-form-item label="图标"
        ><el-select v-model="form.icon" clearable filterable
          ><el-option v-for="name in iconNames" :key="name" :value="name" :label="name"
            ><el-icon><component :is="Icons[name as keyof typeof Icons]" /></el-icon>
            {{ name }}</el-option
          ></el-select
        ></el-form-item
      >
      <div class="menu-options">
        <el-form-item label="排序"
          ><el-input-number v-model="form.sortOrder" :min="0" :max="99999"
        /></el-form-item>
        <el-form-item label="导航显示"
          ><el-switch
            v-model="form.visible"
            :disabled="form.menuType === 'PAGE' && !!form.routePath?.includes(':')"
            aria-label="导航显示"
        /></el-form-item>
        <el-form-item label="启用"
          ><el-switch v-model="form.enabled" aria-label="启用菜单"
        /></el-form-item>
      </div>
      <div class="editor-footer">
        <el-button :icon="Close" @click="visible = false">取消</el-button
        ><el-button type="primary" native-type="submit" :icon="Check" :loading="saving"
          >保存</el-button
        >
      </div>
    </el-form>
  </el-dialog>
</template>

<style scoped>
.menu-options {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}
.editor-footer {
  display: flex;
  justify-content: flex-end;
}
.el-switch {
  --el-switch-on-color: var(--crm-color-primary);
  --el-switch-off-color: var(--crm-color-danger);
}
</style>
