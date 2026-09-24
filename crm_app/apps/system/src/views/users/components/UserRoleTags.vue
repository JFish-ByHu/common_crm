<script setup lang="ts">
import { computed } from 'vue'
import type { RoleSelectItem } from '../types'

const props = withDefaults(defineProps<{ roles?: RoleSelectItem[] | null; limit?: number }>(), {
  roles: null,
  limit: 2
})
const rolesLoaded = computed(() => Array.isArray(props.roles))
const roleItems = computed(() => (Array.isArray(props.roles) ? props.roles : []))
</script>

<template>
  <div class="user-role-tags">
    <template v-if="roleItems.length">
      <el-tag
        v-for="role in roleItems.slice(0, limit)"
        :key="role.roleId"
        :type="role.roleStatus === 0 ? 'info' : 'primary'"
        :title="`${role.roleName}${role.roleStatus === 0 ? '（停用）' : ''}`"
      >
        <span class="role-name"
          >{{ role.roleName }}{{ role.roleStatus === 0 ? '（停用）' : '' }}</span
        >
      </el-tag>
      <el-popover v-if="roleItems.length > limit" trigger="click" :width="280" placement="bottom">
        <template #reference>
          <el-button text size="small" :aria-label="`查看全部 ${roleItems.length} 个角色`">
            +{{ roleItems.length - limit }}
          </el-button>
        </template>
        <div class="all-roles">
          <el-tag
            v-for="role in roleItems"
            :key="role.roleId"
            :type="role.roleStatus === 0 ? 'info' : 'primary'"
          >
            {{ role.roleName }}{{ role.roleStatus === 0 ? '（停用）' : '' }}
          </el-tag>
        </div>
      </el-popover>
    </template>
    <span v-else class="empty-roles">{{ rolesLoaded ? '未分配角色' : '暂未获取角色信息' }}</span>
  </div>
</template>

<style scoped>
.user-role-tags,
.all-roles {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.role-name {
  display: block;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.all-roles :deep(.el-tag) {
  height: auto;
  max-width: 100%;
  padding-block: 4px;
  white-space: normal;
  overflow-wrap: anywhere;
}
.empty-roles {
  color: var(--el-text-color-regular);
}
</style>
