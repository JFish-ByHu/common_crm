<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MicroAppView from '../../views/micro-app/index.vue'

const route = useRoute()
const isMicroAppRoute = computed(() => Boolean(route.meta.microApp))
</script>

<template>
  <main class="content">
    <RouterView v-if="!isMicroAppRoute" />
    <!-- 容器常驻，避免浏览器前进后退时 qiankun 先于 RouterView 挂载。 -->
    <MicroAppView v-show="isMicroAppRoute" />
  </main>
</template>

<style scoped>
.content {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  background: var(--crm-color-surface);
}
</style>
