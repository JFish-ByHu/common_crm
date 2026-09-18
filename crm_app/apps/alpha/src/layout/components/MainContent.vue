<template>
  <main class="content">
    <div id="micro-app-container" class="micro-app-wrapper"></div>
  </main>
</template>

<style scoped>
.content {
  flex: 1;
  overflow: auto;
}

.micro-app-wrapper {
  min-height: 100%;
  background: var(--crm-color-surface);
}

:global(:root[data-theme='dark']) .micro-app-wrapper {
  box-shadow: 0 1px 3px rgb(0 0 0 / 30%);
}
</style>
