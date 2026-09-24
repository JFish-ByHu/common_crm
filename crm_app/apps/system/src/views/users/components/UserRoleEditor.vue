<script setup lang="ts">
import { computed } from 'vue'
import { Check, Close } from '@element-plus/icons-vue'
import type { RoleSelectItem } from '../../../services'
import type { UserListItem } from '../types'

const props = defineProps<{
  user: UserListItem | null
  options: RoleSelectItem[]
  assignedRoleIds: string[]
  loading: boolean
  saving: boolean
  loaded: boolean
}>()
const visible = defineModel<boolean>({ default: false })
const roleIds = defineModel<string[]>('roleIds', { default: () => [] })
defineEmits<{ save: []; retry: [] }>()
const assignedIds = computed(() => new Set(props.assignedRoleIds))
const closeRoleEditor = () => {
  if (!props.saving) visible.value = false
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="`分配角色 · ${user?.username ?? ''}`"
    width="min(560px, calc(100vw - 32px))"
    :close-on-click-modal="false"
    :close-on-press-escape="!saving"
    :show-close="!saving"
    destroy-on-close
  >
    <div v-loading="loading" class="user-role-body">
      <el-form
        v-if="loaded"
        label-position="top"
        :disabled="saving"
        @submit.prevent="$emit('save')"
      >
        <el-form-item label="角色" for="user-role-select">
          <el-select
            id="user-role-select"
            v-model="roleIds"
            multiple
            filterable
            clearable
            placeholder="请选择角色，可多选"
            class="user-role-select"
            no-data-text="暂无可选角色，请先在角色管理中创建"
          >
            <el-option
              v-for="role in options"
              :key="role.roleId"
              :value="role.roleId"
              :label="`${role.roleName}（${role.roleCode}）${role.roleStatus === 0 ? ' · 已停用' : ''}`"
              :disabled="role.roleStatus === 0 && !assignedIds.has(role.roleId)"
            />
          </el-select>
        </el-form-item>
        <p class="user-role-hint">
          清空后保存，将解除该用户的全部角色。已分配的停用角色可保留或移除。
        </p>
      </el-form>
      <el-empty v-else-if="!loading" description="暂未获取到角色选项">
        <el-button type="primary" @click="$emit('retry')">重新加载</el-button>
      </el-empty>
    </div>
    <template #footer>
      <el-button :icon="Close" :disabled="saving" @click="closeRoleEditor">取消</el-button>
      <el-button
        type="primary"
        :icon="Check"
        :loading="saving"
        :disabled="loading || !loaded"
        @click="$emit('save')"
        >保存</el-button
      >
    </template>
  </el-dialog>
</template>

<style scoped>
.user-role-body {
  min-height: 160px;
}
.user-role-select {
  width: 100%;
}
.user-role-hint {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}
</style>
