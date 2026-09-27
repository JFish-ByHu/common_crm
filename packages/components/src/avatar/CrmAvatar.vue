<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { User } from '@element-plus/icons-vue'

const props = withDefaults(
  defineProps<{
    src?: string | null
    size?: number
    alt?: string
    load?: (url: string, signal: AbortSignal) => Promise<Blob>
  }>(),
  { src: null, size: 36, alt: '用户头像', load: undefined }
)
const imageUrl = ref('')
const loading = ref(false)
let controller: AbortController | undefined
let objectUrl: string | undefined

const releaseImage = () => {
  controller?.abort()
  controller = undefined
  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = undefined
  imageUrl.value = ''
}

watch(
  () => [props.src, props.load] as const,
  async ([src, load]) => {
    releaseImage()
    loading.value = false
    if (!src) return
    if (!load) {
      imageUrl.value = src
      return
    }
    const current = new AbortController()
    controller = current
    loading.value = true
    try {
      const blob = await load(src, current.signal)
      if (current.signal.aborted || controller !== current) return
      objectUrl = URL.createObjectURL(blob)
      imageUrl.value = objectUrl
    } catch {
      // 装饰性头像读取失败回退默认图标，避免列表中的多张图片重复弹通知。
    } finally {
      if (controller === current) loading.value = false
    }
  },
  { immediate: true }
)

onBeforeUnmount(releaseImage)
</script>

<template>
  <el-avatar
    :key="imageUrl"
    :src="imageUrl"
    :size="size"
    :alt="alt"
    :aria-label="alt"
    :aria-busy="loading"
    :icon="User"
    class="crm-avatar"
  />
</template>

<style scoped>
.crm-avatar {
  flex-shrink: 0;
  vertical-align: middle;
  background: var(--crm-color-primary-soft, var(--el-fill-color-light));
  color: var(--crm-color-primary, var(--el-color-primary));
}
</style>
