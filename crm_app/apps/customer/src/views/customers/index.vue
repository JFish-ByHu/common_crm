<script setup lang="ts">
import { ref } from 'vue'
import { CrmFilterBar, CrmTable } from '@common-crm/components'
import { CustomerDetails } from './components'
import { customerActions, customerColumns, customerFilterFields } from './config'
import { useCustomerList } from './hooks'
import type { CustomerListItem } from './types'

const { filters, visibleCustomers, currentPage, pageSize, applyFilters, resetFilters } =
  useCustomerList()
const detailsVisible = ref(false)
const selectedCustomer = ref<CustomerListItem | null>(null)

function handleAction(key: string, row: CustomerListItem) {
  if (key === 'view') {
    selectedCustomer.value = row
    detailsVisible.value = true
  }
}
</script>

<template>
  <section class="customer-management" aria-label="客户管理">
    <CrmFilterBar
      v-model="filters"
      :fields="customerFilterFields"
      @search="applyFilters"
      @reset="resetFilters"
    />
    <CrmTable
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :data="visibleCustomers"
      :columns="customerColumns"
      :actions="customerActions"
      row-key="customerId"
      empty-text="暂无客户数据"
      @action="handleAction"
    />
    <CustomerDetails v-model="detailsVisible" :customer="selectedCustomer" />
  </section>
</template>

<style scoped>
.customer-management {
  min-width: 0;
  min-height: calc(100vh - 64px);
  padding: 24px;
  background: var(--crm-color-surface);
}

@media (max-width: 720px) {
  .customer-management {
    padding: 16px;
  }
}
</style>
