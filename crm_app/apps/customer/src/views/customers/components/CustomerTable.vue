<script setup lang="ts">
import type { CustomerListItem } from '../types'

defineProps<{
  customers: CustomerListItem[]
}>()
</script>

<template>
  <el-table :data="customers" class="customer-table" empty-text="暂无客户数据">
    <el-table-column prop="name" label="客户名称" min-width="220" />
    <el-table-column prop="contactName" label="联系人" min-width="160">
      <template #default="scope">
        {{ scope.row.contactName || '-' }}
      </template>
    </el-table-column>
    <el-table-column prop="phone" label="联系电话" min-width="160">
      <template #default="scope">
        {{ scope.row.phone || '-' }}
      </template>
    </el-table-column>
    <el-table-column prop="updatedAt" label="更新时间" min-width="180" />
  </el-table>
</template>

<style scoped>
.customer-table {
  width: 100%;
}
</style>
