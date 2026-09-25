<script setup lang="ts">
import type { LayoutMenuItem } from './Sidebar.vue'
import { Notification } from '@common-crm/utils'
const props = defineProps<{ item: LayoutMenuItem }>()

// 在 Element Plus 更新选中态之前拦截占位菜单，保持当前页面的高亮状态。
const notifyUnconfiguredMenu = (event: MouseEvent | KeyboardEvent) => {
  if (!props.item.path.startsWith('unconfigured:')) return
  if ('key' in event && event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  event.stopPropagation()
  Notification.info('该菜单暂未配置页面')
}
</script>

<template>
  <el-sub-menu v-if="item.children" :index="item.path">
    <template #title
      ><el-icon v-if="item.icon"><component :is="item.icon" /></el-icon
      ><span>{{ item.title }}</span></template
    >
    <SidebarItem v-for="child in item.children" :key="child.path" :item="child" />
  </el-sub-menu>
  <el-menu-item
    v-else
    :index="item.path"
    @click.capture="notifyUnconfiguredMenu"
    @keydown.capture="notifyUnconfiguredMenu"
    ><el-icon v-if="item.icon"><component :is="item.icon" /></el-icon
    ><template #title
      ><span>{{ item.title }}</span></template
    ></el-menu-item
  >
</template>
