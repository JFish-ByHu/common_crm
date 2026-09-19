<script setup lang="ts">
import { Odometer, Setting, TrendCharts, User } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { DashboardCard } from './components'

const router = useRouter()

const dashboardSections = [
  {
    title: '客户概览',
    description: '查看客户档案、联系人和客户维护情况。',
    icon: User,
    actionText: '进入客户管理',
    path: '/customer'
  },
  {
    title: '销售概览',
    description: '后续展示销售机会、跟进进度和业绩趋势。',
    icon: TrendCharts,
    disabled: true
  },
  {
    title: '系统概览',
    description: '查看平台用户、账号状态和系统基础配置。',
    icon: Setting,
    actionText: '进入系统管理',
    path: '/system'
  }
]

const navigateTo = (path?: string) => {
  if (path) router.push(path)
}
</script>

<template>
  <section class="dashboard-page" aria-labelledby="dashboard-title">
    <header class="dashboard-header">
      <div>
        <div class="dashboard-eyebrow">
          <el-icon><Odometer /></el-icon>
          <span>平台总览</span>
        </div>
        <h1 id="dashboard-title">控制台</h1>
        <p>从这里快速进入各业务模块，后续将补充平台运营数据。</p>
      </div>
    </header>

    <div class="dashboard-grid">
      <DashboardCard
        v-for="section in dashboardSections"
        :key="section.title"
        :title="section.title"
        :description="section.description"
        :icon="section.icon"
        :action-text="section.actionText"
        :disabled="section.disabled"
        @action="navigateTo(section.path)"
      />
    </div>
  </section>
</template>

<style scoped>
.dashboard-page {
  min-height: 100%;
  padding: 32px;
  background: var(--crm-color-surface);
}

.dashboard-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  max-width: 1180px;
  margin: 0 auto;
}

.dashboard-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--crm-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.dashboard-header h1 {
  margin-top: 10px;
  color: var(--crm-color-text);
  font-size: 28px;
  font-weight: 600;
  line-height: 1.25;
}

.dashboard-header p {
  max-width: 560px;
  margin-top: 8px;
  color: var(--crm-color-text-muted);
  font-size: 14px;
  line-height: 1.6;
}

.dashboard-grid {
  display: grid;
  max-width: 1180px;
  margin: 32px auto 0;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 960px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .dashboard-page {
    padding: 24px 16px;
  }

  .dashboard-grid {
    grid-template-columns: minmax(0, 1fr);
    margin-top: 24px;
  }
}
</style>
