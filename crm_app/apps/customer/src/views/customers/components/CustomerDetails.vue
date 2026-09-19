<script setup lang="ts">
import type { CustomerListItem } from '../types'

defineProps<{ customer: CustomerListItem | null }>()
const visible = defineModel<boolean>({ default: false })
</script>

<template>
  <el-dialog
    v-model="visible"
    title="客户详情"
    width="min(560px, calc(100vw - 32px))"
    destroy-on-close
  >
    <el-descriptions v-if="customer" :column="1" border>
      <el-descriptions-item label="客户名称">{{ customer.name }}</el-descriptions-item>
      <el-descriptions-item label="联系人">{{ customer.contactName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="联系电话">{{ customer.phone || '-' }}</el-descriptions-item>
      <el-descriptions-item label="更新时间">{{ customer.updatedAt }}</el-descriptions-item>
    </el-descriptions>
  </el-dialog>
</template>
