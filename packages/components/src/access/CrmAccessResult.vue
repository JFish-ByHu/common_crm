<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue'
defineProps<{ unavailable?: boolean }>()
const retryPage = () => window.location.reload()
</script>

<template>
  <el-result
    :icon="unavailable ? 'warning' : 'info'"
    :title="unavailable ? '权限信息加载失败' : '暂无访问权限'"
    :sub-title="unavailable ? '请稍后重试' : '请联系管理员分配相应菜单和操作权限'"
  >
    <template #extra><el-button :icon="Refresh" @click="retryPage">重新加载</el-button></template>
  </el-result>
</template>
