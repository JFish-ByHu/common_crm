<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { Check, Close } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { RoleFormValues, RoleListItem } from '../types'

const props = defineProps<{ role: RoleListItem | null; saving: boolean }>()
const visible = defineModel<boolean>({ default: false })
const emit = defineEmits<{ save: [values: RoleFormValues] }>()
const formRef = ref<FormInstance>()
const validating = ref(false)
const editing = computed(() => props.role !== null)
const busy = computed(() => props.saving || validating.value)
const form = reactive<RoleFormValues>({ roleName: '', roleCode: '', roleStatus: 1, remark: '' })
const rules: FormRules<RoleFormValues> = {
  roleName: [
    { required: true, whitespace: true, message: '请输入角色名称', trigger: 'blur' },
    { max: 64, message: '角色名称不能超过 64 个字符', trigger: 'blur' }
  ],
  roleCode: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    {
      pattern: /^[a-z][a-z0-9_]{0,63}$/,
      message: '以小写字母开头，只能包含小写字母、数字和下划线，最多 64 位',
      trigger: 'blur'
    }
  ],
  remark: [{ max: 255, message: '备注不能超过 255 个字符', trigger: 'blur' }]
}

watch(visible, async value => {
  if (!value) return
  Object.assign(form, {
    roleName: props.role?.roleName ?? '',
    roleCode: props.role?.roleCode ?? '',
    roleStatus: props.role?.roleStatus ?? 1,
    remark: props.role?.remark ?? ''
  })
  await nextTick()
  formRef.value?.clearValidate()
})

const submitRoleForm = async () => {
  if (busy.value || !formRef.value) return
  validating.value = true
  try {
    const valid = await formRef.value.validate().catch(() => false)
    if (valid) emit('save', { ...form })
  } finally {
    validating.value = false
  }
}
const closeRoleEditor = () => {
  if (!busy.value) visible.value = false
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="editing ? '编辑角色' : '新增角色'"
    width="min(520px, calc(100vw - 32px))"
    :close-on-click-modal="false"
    :close-on-press-escape="!busy"
    :show-close="!busy"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      :disabled="busy"
      label-position="top"
      @submit.prevent="submitRoleForm"
    >
      <el-form-item label="角色名称" prop="roleName">
        <el-input v-model.trim="form.roleName" maxlength="64" placeholder="请输入角色名称" />
      </el-form-item>
      <el-form-item label="角色编码" prop="roleCode">
        <el-input
          v-model.trim="form.roleCode"
          maxlength="64"
          :disabled="editing"
          placeholder="例如 sales_manager"
        />
        <p class="role-editor-hint">角色编码创建后不可修改。</p>
      </el-form-item>
      <el-form-item label="角色状态" prop="roleStatus">
        <el-switch
          v-model="form.roleStatus"
          :active-value="1"
          :inactive-value="0"
          class="role-status-switch"
          :aria-label="`角色状态：${form.roleStatus === 1 ? '启用' : '停用'}`"
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          maxlength="255"
          show-word-limit
          placeholder="请输入备注（选填）"
        />
      </el-form-item>
      <div class="role-editor-actions">
        <el-button :icon="Close" :disabled="busy" @click="closeRoleEditor">取消</el-button>
        <el-button type="primary" native-type="submit" :icon="Check" :loading="busy"
          >保存</el-button
        >
      </div>
    </el-form>
  </el-dialog>
</template>

<style scoped>
.role-editor-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
}
.role-editor-hint {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}
.role-status-switch {
  --el-switch-on-color: var(--crm-color-primary);
  --el-switch-off-color: var(--crm-color-danger);
}
</style>
