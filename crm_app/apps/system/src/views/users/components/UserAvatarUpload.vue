<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Delete, Upload } from '@element-plus/icons-vue'
import type { UploadFile, UploadInstance } from 'element-plus'
import { CrmAvatar } from '@common-crm/components'
import { loadAvatar, uploadFile } from '@common-crm/api'
import { notifyRequestError } from '@common-crm/utils'

const props = defineProps<{ initialUrl: string | null; disabled: boolean; active: boolean }>()
const fileId = defineModel<string | null>({ required: true })
const emit = defineEmits<{ uploading: [value: boolean] }>()
const uploadRef = ref<UploadInstance>()
const uploading = ref(false)
const progress = ref(0)
const localUrl = ref('')
const validationMessage = ref('')
let controller: AbortController | undefined
const previewUrl = computed(() => (fileId.value ? localUrl.value || props.initialUrl : null))

const releasePreview = () => {
  if (localUrl.value) URL.revokeObjectURL(localUrl.value)
  localUrl.value = ''
}
const cancelUpload = () => {
  controller?.abort()
  controller = undefined
  uploading.value = false
  emit('uploading', false)
  uploadRef.value?.clearFiles()
}
const selectAvatar = async (selection: UploadFile) => {
  const file = selection.raw
  if (!file || uploading.value || props.disabled || !props.active) return
  validationMessage.value = ''
  if (
    !/\.(jpe?g|png|webp)$/i.test(file.name) ||
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  ) {
    validationMessage.value = '请选择 JPG、PNG 或 WebP 图片'
  } else if (!file.size || file.size > 5 * 1024 * 1024) {
    validationMessage.value = '请选择非空且不超过 5 MB 的图片'
  }
  if (validationMessage.value) {
    uploadRef.value?.clearFiles()
    return
  }
  const current = new AbortController()
  controller = current
  uploading.value = true
  emit('uploading', true)
  progress.value = 0
  try {
    const result = await uploadFile(
      file,
      { category: 'avatar' },
      {
        signal: current.signal,
        showProgress: false,
        onUploadProgress: event => {
          if (controller === current && event.total)
            progress.value = Math.min(99, Math.round((event.loaded / event.total) * 100))
        }
      }
    )
    if (current.signal.aborted || controller !== current || !props.active) return
    if (!result.data) throw new Error('Missing uploaded file')
    releasePreview()
    localUrl.value = URL.createObjectURL(file)
    fileId.value = result.data.fileId
    progress.value = 100
  } catch (error) {
    if (!current.signal.aborted && props.active)
      notifyRequestError(error, { title: '头像上传失败', message: '上传失败，请稍后重试' })
  } finally {
    if (controller === current) {
      controller = undefined
      uploading.value = false
      emit('uploading', false)
      uploadRef.value?.clearFiles()
    }
  }
}
const removeAvatar = () => {
  if (props.disabled || uploading.value) return
  releasePreview()
  fileId.value = null
  validationMessage.value = ''
}
watch(
  () => props.active,
  active => {
    cancelUpload()
    if (active) {
      releasePreview()
      validationMessage.value = ''
    }
  }
)
onBeforeUnmount(() => {
  cancelUpload()
  releasePreview()
})
</script>

<template>
  <div class="avatar-upload" :aria-busy="uploading">
    <CrmAvatar
      :src="previewUrl"
      :load="localUrl ? undefined : loadAvatar"
      :size="72"
      alt="用户头像预览"
    />
    <div class="avatar-upload-content">
      <div class="avatar-upload-actions">
        <el-upload
          ref="uploadRef"
          action="#"
          :auto-upload="false"
          :show-file-list="false"
          accept=".jpg,.jpeg,.png,.webp"
          :disabled="disabled || uploading"
          :on-change="selectAvatar"
        >
          <el-button :icon="Upload" :disabled="disabled || uploading">{{
            fileId ? '更换头像' : '上传头像'
          }}</el-button>
        </el-upload>
        <el-button v-if="uploading" @click="cancelUpload">取消上传</el-button>
        <el-button
          v-else-if="fileId"
          :icon="Delete"
          :disabled="disabled"
          text
          type="danger"
          @click="removeAvatar"
          >移除</el-button
        >
      </div>
      <el-progress v-if="uploading" :percentage="progress" :stroke-width="4" />
      <p class="avatar-upload-hint" role="status">
        {{
          uploading
            ? progress >= 99
              ? '正在校验图片，请稍候…'
              : '正在上传…'
            : '支持 JPG、PNG、WebP，最大 5 MB；保存用户后生效。'
        }}
      </p>
      <p v-if="validationMessage" class="avatar-upload-error" role="alert">
        {{ validationMessage }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.avatar-upload {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}
.avatar-upload-content {
  flex: 1;
  min-width: 0;
}
.avatar-upload-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.avatar-upload-hint,
.avatar-upload-error {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.5;
}
.avatar-upload-hint {
  color: var(--el-text-color-secondary);
}
.avatar-upload-error {
  color: var(--crm-color-danger);
}
</style>
