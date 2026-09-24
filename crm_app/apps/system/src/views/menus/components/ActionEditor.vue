<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { Check, Close } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { ApiPermissionRule, MenuActionInput, MenuActionItem, MenuItem } from '../types'

const visible = defineModel<boolean>({ default: false })
const props = defineProps<{
  menu: MenuItem | null
  action: MenuActionItem | null
  endpoints: ApiPermissionRule[]
  menus: MenuItem[]
  saving: boolean
}>()
const emit = defineEmits<{ save: [input: MenuActionInput] }>()
const formRef = ref<FormInstance>()
const form = reactive<MenuActionInput>({
  menuId: '',
  name: '',
  permissionCode: '',
  sortOrder: 0,
  enabled: true,
  rules: []
})
const selectedEndpoints = ref<string[]>([])
const boundEndpoints = computed(() => {
  const collect = (menus: MenuItem[]): string[] =>
    menus.flatMap(menu => [
      ...menu.actions
        .filter(action => action.actionId !== props.action?.actionId)
        .flatMap(action => action.rules.map(rule => `${rule.httpMethod} ${rule.path}`)),
      ...collect(menu.children)
    ])
  return new Set(collect(props.menus))
})
const rules: FormRules<MenuActionInput> = {
  name: [{ required: true, whitespace: true, message: '请输入按钮名称', trigger: 'blur' }],
  permissionCode: [
    {
      required: true,
      pattern: /^[a-zA-Z][a-zA-Z0-9:_.-]{0,127}$/,
      message: '请输入合法的权限标识',
      trigger: 'blur'
    }
  ]
}
watch(visible, async open => {
  if (!open) return
  Object.assign(form, {
    menuId: props.menu?.menuId ?? '',
    name: props.action?.name ?? '',
    permissionCode: props.action?.permissionCode ?? '',
    sortOrder: props.action?.sortOrder ?? 0,
    enabled: props.action?.enabled ?? true
  })
  selectedEndpoints.value = props.action?.rules.map(rule => `${rule.httpMethod} ${rule.path}`) ?? []
  await nextTick()
  formRef.value?.clearValidate()
})
const submitAction = async () => {
  if (props.saving || !(await formRef.value?.validate().catch(() => false))) return
  const selected = new Set(selectedEndpoints.value)
  emit('save', {
    ...form,
    rules: props.endpoints.filter(rule => selected.has(`${rule.httpMethod} ${rule.path}`))
  })
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="action ? '编辑按钮权限' : '新增按钮权限'"
    width="min(640px, calc(100vw - 32px))"
    append-to-body
    :close-on-click-modal="false"
    :close-on-press-escape="!saving"
    :show-close="!saving"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      :disabled="saving"
      label-position="top"
      @submit.prevent="submitAction"
    >
      <el-form-item label="按钮名称" prop="name"
        ><el-input v-model.trim="form.name" maxlength="64"
      /></el-form-item>
      <el-form-item label="权限标识" prop="permissionCode"
        ><el-input v-model.trim="form.permissionCode" maxlength="128"
      /></el-form-item>
      <el-form-item label="接口权限"
        ><el-select
          v-model="selectedEndpoints"
          multiple
          filterable
          collapse-tags
          collapse-tags-tooltip
          placeholder="选择对应接口"
          ><el-option
            v-for="rule in endpoints"
            :key="`${rule.httpMethod} ${rule.path}`"
            :value="`${rule.httpMethod} ${rule.path}`"
            :label="`${rule.httpMethod} ${rule.path}`"
            :disabled="boundEndpoints.has(`${rule.httpMethod} ${rule.path}`)" /></el-select
      ></el-form-item>
      <el-form-item label="排序"
        ><el-input-number v-model="form.sortOrder" :min="0" :max="99999"
      /></el-form-item>
      <el-form-item label="启用"
        ><el-switch v-model="form.enabled" aria-label="启用按钮权限"
      /></el-form-item>
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
.editor-footer {
  display: flex;
  justify-content: flex-end;
}
.el-switch {
  --el-switch-on-color: var(--crm-color-primary);
  --el-switch-off-color: var(--crm-color-danger);
}
</style>
