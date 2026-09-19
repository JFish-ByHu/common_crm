<template>
  <div id="micro-app-container" class="micro-app-wrapper"></div>
</template>

<style scoped>
.micro-app-wrapper {
  width: 100%;
  min-width: 0;
  min-height: 100%;
  background: var(--crm-color-surface);
}

:global(:root[data-theme='dark']) .micro-app-wrapper {
  box-shadow: 0 1px 3px rgb(0 0 0 / 30%);
}
</style>
