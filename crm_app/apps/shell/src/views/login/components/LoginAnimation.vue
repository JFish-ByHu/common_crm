<script setup lang="ts">
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'

defineProps<{
  backgroundColor?: string
}>()

const animationSource = new URL('../../../assets/lottie/login_bg.lottie', import.meta.url).href
</script>

<template>
  <DotLottieVue
    class="login-animation"
    :src="animationSource"
    :background-color="backgroundColor"
    autoplay
    loop
    aria-hidden="true"
  />
</template>

<style scoped>
.login-animation {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.login-animation :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
