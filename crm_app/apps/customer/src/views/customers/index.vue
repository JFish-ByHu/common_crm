<script setup lang="ts">
import { CustomerTable } from './components'
import { useCustomerList } from './hooks'

const { customers } = useCustomerList()
</script>

<template>
  <section class="customer-management" aria-labelledby="customer-management-title">
    <header class="page-header">
      <div>
        <h1 id="customer-management-title">客户管理</h1>
        <p>管理客户档案和联系人信息</p>
      </div>
    </header>

    <div class="table-region">
      <CustomerTable :customers="customers" />
    </div>
  </section>
</template>

<style scoped>
.customer-management {
  min-height: calc(100vh - 64px);
  padding: 24px;
  background: var(--crm-color-surface);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
}

.page-header h1 {
  color: var(--crm-color-text);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.4;
}

.page-header p {
  margin-top: 4px;
  color: var(--crm-color-text-muted);
  font-size: 14px;
}

.table-region {
  padding-top: 16px;
  overflow-x: auto;
}

@media (max-width: 720px) {
  .customer-management {
    padding: 16px;
  }
}
</style>
