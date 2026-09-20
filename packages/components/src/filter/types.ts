import type { DatePickerProps, InputProps, SelectProps } from 'element-plus'

export type FilterDateRange = [Date, Date] | null

export interface FilterOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
}

interface FilterFieldBase<Model> {
  prop: Extract<keyof Model, string>
  /** 用于默认占位提示和无障碍名称，不单独展示标签。 */
  label: string
  width?: string | number
  defaultValue?: Model[keyof Model]
}

export type FilterField<Model = Record<string, unknown>> = FilterFieldBase<Model> &
  (
    | { type: 'input'; props?: Partial<Omit<InputProps, 'modelValue' | 'id'>> }
    | {
        type: 'select'
        options: FilterOption[]
        props?: Partial<Omit<SelectProps, 'modelValue' | 'id'>>
      }
    | { type: 'date-picker'; props?: Partial<Omit<DatePickerProps, 'modelValue' | 'id'>> }
  )
