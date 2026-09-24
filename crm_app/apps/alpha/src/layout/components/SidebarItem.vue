<script setup lang="ts">
import type { LayoutMenuItem } from './Sidebar.vue'
defineProps<{ item: LayoutMenuItem }>()
</script>

<template>
  <el-sub-menu v-if="item.children?.length" :index="item.path">
    <template #title
      ><el-icon v-if="item.icon"><component :is="item.icon" /></el-icon
      ><span>{{ item.title }}</span></template
    >
    <SidebarItem v-for="child in item.children" :key="child.path" :item="child" />
  </el-sub-menu>
  <el-menu-item v-else :index="item.path"
    ><el-icon v-if="item.icon"><component :is="item.icon" /></el-icon
    ><template #title
      ><span>{{ item.title }}</span></template
    ></el-menu-item
  >
</template>
