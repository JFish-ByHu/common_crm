<script setup lang="ts" generic="Model extends object">
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'
import {
  ElButton,
  ElConfigProvider,
  ElDatePicker,
  ElInput,
  ElOption,
  ElSelect,
  type DatePickerProps,
  type SelectProps
} from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { Refresh, Search } from '@element-plus/icons-vue'
import { dateTimeRangeShortcuts } from './shortcuts'
import type { FilterField } from './types'

const props = withDefaults(
  defineProps<{
    fields: FilterField<Model>[]
    loading?: boolean
    showReset?: boolean
  }>(),
  { loading: false, showReset: true }
)

const model = defineModel<Model>({ required: true })
const emit = defineEmits<{ search: [value: Model]; reset: [value: Model] }>()
const formId = useId()
const compact = ref(false)
let mediaQuery: MediaQueryList | undefined

function syncCompact() {
  compact.value = mediaQuery?.matches ?? false
}

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 720px)')
  syncCompact()
  mediaQuery.addEventListener('change', syncCompact)
})
onBeforeUnmount(() => mediaQuery?.removeEventListener('change', syncCompact))

function updateField(field: FilterField<Model>, value: unknown) {
  model.value = { ...model.value, [field.prop]: value }
}

function fieldWidth(field: FilterField<Model>) {
  const width =
    field.width ?? (field.type === 'date-picker' ? 390 : field.type === 'select' ? 180 : 260)
  return typeof width === 'number' ? `${width}px` : width
}

function dateInputId(field: FilterField<Model>): string | [string, string] {
  const id = `${formId}-${field.prop}`
  const type = field.type === 'date-picker' ? (field.props?.type ?? 'datetimerange') : ''
  return type.endsWith('range') ? [id, `${id}-end`] : id
}

function dateValue(field: FilterField<Model>) {
  return model.value[field.prop] as DatePickerProps['modelValue']
}

function defaultShortcuts(field: FilterField<Model>) {
  return field.type === 'date-picker' &&
    (!field.props?.type || field.props.type === 'datetimerange' || field.props.type === 'daterange')
    ? dateTimeRangeShortcuts
    : undefined
}

function search() {
  if (!props.loading) emit('search', { ...model.value })
}

function reset() {
  if (props.loading) return
  const value = { ...model.value }
  for (const field of props.fields) {
    const fallback =
      field.type === 'date-picker'
        ? null
        : field.type === 'select' && field.props?.multiple
          ? []
          : ''
    const initial = field.defaultValue === undefined ? fallback : field.defaultValue
    Object.assign(value, { [field.prop]: Array.isArray(initial) ? [...initial] : initial })
  }
  model.value = value
  emit('reset', value)
}

function handleEnter(event: KeyboardEvent | Event) {
  if (event instanceof KeyboardEvent && !event.isComposing && !event.repeat) {
    event.preventDefault()
    search()
  }
}

defineExpose({ reset, search })
</script>

<template>
  <ElConfigProvider :locale="zhCn">
    <form class="crm-filter-bar" aria-label="筛选条件" @submit.prevent="search">
      <div
        v-for="field in fields"
        :key="field.prop"
        class="crm-filter-field"
        :style="{ '--crm-filter-width': fieldWidth(field) }"
      >
        <ElInput
          v-if="field.type === 'input'"
          :id="`${formId}-${field.prop}`"
          clearable
          :placeholder="`请输入${field.label}`"
          v-bind="field.props"
          :aria-label="field.label"
          :model-value="model[field.prop] == null ? '' : String(model[field.prop])"
          @update:model-value="updateField(field, $event)"
          @keydown.enter="handleEnter"
        />
        <ElSelect
          v-else-if="field.type === 'select'"
          :id="`${formId}-${field.prop}`"
          clearable
          :placeholder="`请选择${field.label}`"
          :value-on-clear="field.props?.multiple ? undefined : ''"
          v-bind="field.props"
          :aria-label="field.label"
          :model-value="model[field.prop] as SelectProps['modelValue']"
          @update:model-value="updateField(field, $event)"
        >
          <ElOption v-for="option in field.options" :key="String(option.value)" v-bind="option" />
        </ElSelect>
        <ElDatePicker
          v-else
          :id="dateInputId(field)"
          type="datetimerange"
          format="YYYY-MM-DD HH:mm"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          :shortcuts="defaultShortcuts(field)"
          :single-panel="compact"
          clearable
          v-bind="field.props"
          :popper-class="['crm-filter-date-popper', field.props?.popperClass]"
          :aria-label="field.label"
          :model-value="dateValue(field)"
          @update:model-value="updateField(field, $event)"
        />
      </div>
      <div class="crm-filter-actions">
        <ElButton type="primary" native-type="submit" :icon="Search" :loading="loading"
          >查询</ElButton
        >
        <ElButton v-if="showReset" :icon="Refresh" :disabled="loading" @click="reset"
          >重置</ElButton
        >
        <slot name="actions" />
      </div>
    </form>
  </ElConfigProvider>
</template>

<style scoped>
.crm-filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px 12px;
  margin: 0;
  padding: 16px 0;
}

.crm-filter-field {
  display: flex;
  flex: 0 1 var(--crm-filter-width);
  align-items: center;
  width: var(--crm-filter-width);
  max-width: 100%;
  min-width: 0;
}

.crm-filter-field :deep(.el-date-editor) {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

/* 保持输入文字与 Element Plus 控件高度一致，避免继承外层表单行高。 */
.crm-filter-field :deep(.el-input__inner) {
  line-height: var(--el-input-inner-height);
}

.crm-filter-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.crm-filter-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

@media (max-width: 720px) {
  .crm-filter-field {
    flex-basis: 100%;
    width: 100%;
  }
}
</style>

<style>
@media (max-width: 720px) {
  .crm-filter-date-popper .el-date-range-picker.single-panel,
  .crm-filter-date-popper .el-date-picker {
    width: 322px;
    max-width: calc(100vw - 24px);
  }

  .crm-filter-date-popper .el-picker-panel__sidebar {
    position: static;
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    padding: 6px;
    border-right: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .crm-filter-date-popper .el-picker-panel__shortcut {
    width: auto;
  }

  .crm-filter-date-popper .el-picker-panel__sidebar + .el-picker-panel__body {
    margin-left: 0;
  }

  .crm-filter-date-popper .el-date-range-picker__time-header {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .crm-filter-date-popper .el-date-range-picker__editors-wrap {
    display: flex;
  }

  .crm-filter-date-popper .el-date-range-picker__time-picker-wrap {
    display: block;
    flex: 1;
    min-width: 0;
  }

  .crm-filter-date-popper .el-date-range-picker__time-header > .el-icon {
    display: none;
  }
}
</style>
