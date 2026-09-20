<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { Check, Close } from '@element-plus/icons-vue'
import type { FormInstance, FormItemRule, FormRules } from 'element-plus'
import type { UserFormValues, UserListItem } from '../types'

const props = defineProps<{ user: UserListItem | null; saving: boolean; error: string }>()
const visible = defineModel<boolean>({ default: false })
const emit = defineEmits<{ save: [values: UserFormValues] }>()
const formRef = ref<FormInstance>()
const validating = ref(false)
const editing = computed(() => props.user !== null)
const busy = computed(() => props.saving || validating.value)
const form = reactive<UserFormValues>({ username: '', email: '', password: '', accountStatus: 1 })

const validateUserPassword: FormItemRule['validator'] = (_rule, value: string, callback) => {
  if (!value && editing.value) return callback()
  if (Array.from(value).length < 6) return callback(new Error('密码至少需要 6 个字符'))
  if (new TextEncoder().encode(value).length > 72) {
    return callback(new Error('密码不能超过 72 字节，中文字符会占用多个字节'))
  }
  callback()
}

const rules: FormRules<UserFormValues> = {
  username: [
    { required: true, whitespace: true, message: '请输入用户名', trigger: 'blur' },
    { max: 64, message: '用户名不能超过 64 个字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
    { max: 255, message: '邮箱不能超过 255 个字符', trigger: 'blur' }
  ],
  password: [{ validator: validateUserPassword, trigger: 'blur' }]
}

watch(visible, async value => {
  if (!value) return
  Object.assign(form, {
    username: props.user?.username ?? '',
    email: props.user?.email ?? '',
    password: '',
    accountStatus: props.user?.accountStatus ?? 1
  })
  await nextTick()
  formRef.value?.clearValidate()
})

const submitUserForm = async () => {
  if (busy.value || !formRef.value) return
  validating.value = true
  try {
    const valid = await formRef.value.validate().catch(() => false)
    if (valid) emit('save', { ...form })
  } finally {
    validating.value = false
  }
}

const closeUserEditor = () => {
  if (!busy.value) visible.value = false
}

const clearUserPassword = () => {
  form.password = ''
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="editing ? '编辑用户' : '新增用户'"
    width="min(520px, calc(100vw - 32px))"
    :close-on-click-modal="false"
    :close-on-press-escape="!busy"
    :show-close="!busy"
    destroy-on-close
    @closed="clearUserPassword"
  >
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="false"
      show-icon
      class="save-error"
    />
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      :disabled="busy"
      label-position="top"
      @submit.prevent="submitUserForm"
    >
      <el-form-item label="用户名" prop="username">
        <el-input v-model.trim="form.username" maxlength="64" autocomplete="off" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model.trim="form.email" maxlength="255" autocomplete="off" />
      </el-form-item>
      <el-form-item
        :label="editing ? '新密码（选填）' : '初始密码'"
        prop="password"
        :required="!editing"
      >
        <el-input
          v-model="form.password"
          type="password"
          show-password
          autocomplete="new-password"
        />
      </el-form-item>
      <el-form-item v-if="!editing" label="账号状态" prop="accountStatus">
        <el-switch
          v-model="form.accountStatus"
          :active-value="1"
          :inactive-value="0"
          class="user-status-switch"
          :aria-label="`账号状态：${form.accountStatus === 1 ? '正常' : '停用'}`"
        />
      </el-form-item>
      <div class="user-editor-actions">
        <el-button :icon="Close" :disabled="busy" @click="closeUserEditor">取消</el-button>
        <el-button type="primary" native-type="submit" :icon="Check" :loading="busy"
          >保存</el-button
        >
      </div>
    </el-form>
  </el-dialog>
</template>

<style scoped>
.save-error {
  margin-bottom: 20px;
}

.user-editor-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
}

.user-status-switch {
  --el-switch-on-color: var(--crm-color-primary);
  --el-switch-off-color: var(--crm-color-danger);
}
</style>
