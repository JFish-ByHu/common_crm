# 公共列表组件

从 `@common-crm/components` 统一导入组件和类型。基于 Element Plus，应用入口需要加载 Element Plus 样式。

## 筛选栏

`CrmFilterBar` 使用 `v-model` 保存待查询条件，`fields` 决定渲染哪些控件。输入不会直接触发查询，点击查询或在普通输入框按 Enter 才触发 `search`。中文输入法确认候选词不会触发查询。

```ts
import { ref } from 'vue'
import { CrmFilterBar, type FilterDateRange, type FilterField } from '@common-crm/components'

interface Filters {
  keyword: string
  status: string
  updatedAt: FilterDateRange
}

const filters = ref<Filters>({ keyword: '', status: '', updatedAt: null })
const fields: FilterField<Filters>[] = [
  { prop: 'keyword', label: '关键词', type: 'input', props: { clearable: true } },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [{ label: '正常', value: 'active' }]
  },
  { prop: 'updatedAt', label: '更新时间', type: 'date-picker' }
]
```

```vue
<CrmFilterBar v-model="filters" :fields="fields" @search="queryList" @reset="queryList" />
```

| 配置             | 含义                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------- |
| `prop` / `label` | 条件字段名及可见标签                                                                         |
| `type`           | `input`、`select`、`date-picker`                                                             |
| `width`          | 控件宽度，数字为 px；窄屏自动换行                                                            |
| `props`          | 对应 Element Plus 控件的属性，例如 placeholder、disabled、multiple、filterable、disabledDate |
| `options`        | select 选项，包含 label、value、disabled                                                     |
| `defaultValue`   | 重置值，默认 input/单选为空字符串，多选为空数组，日期为空                                    |

日期默认使用 `datetimerange`，模型值为 `[Date, Date] | null`，内置“今天、最近 7 天、最近 30 天”。通过 `props` 可设置 `type`、`shortcuts`、`format`、`valueFormat`；设置 `valueFormat` 后需相应调整页面的模型类型和查询逻辑。

`search`、`reset` 均携带完整条件对象。重置先更新 `v-model` 再触发事件；组件不会自行请求接口。可使用 `#actions` 插槽追加业务按钮。

## 表格

`CrmTable` 默认开启边框、多选、右侧固定操作列和分页。分页默认每页 10 条，选项为 10/20/50/100。

```ts
import { CrmTable, type TableColumn, type TableAction } from '@common-crm/components'

interface User {
  userId: string
  username: string
  email: string | null
}

const columns: TableColumn<User>[] = [
  { prop: 'username', label: '用户名', minWidth: 180 },
  { prop: 'email', label: '邮箱', minWidth: 240 }
]
const actions: TableAction<User>[] = [
  { key: 'view', label: '查看详情', icon: 'View' },
  { key: 'edit', label: '编辑', icon: 'Edit' }
]
```

```vue
<CrmTable
  v-model:current-page="currentPage"
  v-model:page-size="pageSize"
  :data="filteredUsers"
  :columns="columns"
  :actions="actions"
  row-key="userId"
  @action="handleAction"
  @selection-change="handleSelection"
/>
```

- `action` 事件参数为 `(key, row, index)`，由业务页面执行查看、编辑等行为。默认 actions 为空，不内置业务增删改。
- 图标支持 Element Plus 名称（`View` / `Edit` / `Delete`）、兼容名称（`el-icon-edit`）或直接传 Vue 图标组件。Element Plus 使用 SVG 图标组件，不依赖字体图标 class。
- 操作默认显示图标并提供 tooltip；`showLabel: true` 显示图标和文字。`hidden`、`disabled` 支持布尔值或 `(row) => boolean`。
- `actionColumn` 可配置 `label`、`width`、`fixed`。默认宽 120px、固定在右侧，多操作时可增加宽度。
- `border`、`selection`、`showActions`、`pagination` 均可传 false 关闭。
- `columns` 支持宽度、对齐、固定、排序、格式化和自定义 slot。`#字段名="{ row, column, index }"` 可自定义单元格，也可通过 `column.slot` 指定 slot 名称。
- 默认 slot 可直接传 `el-table-column`；另有 `#actions`、`#empty`、`#append` 插槽。其余属性和事件透传给 `el-table`。
- 提供 `doLayout()`、`clearSelection()`、`toggleRowSelection(row, selected?)`、`getSelectionRows()` 实例方法。跨页保留勾选需同时设置 `row-key` 和 `reserve-selection`。

### 分页模式

默认 `pagination-mode="client"`：传入完整筛选结果，组件计算 total 并切片展示。查询、重置时由页面把 currentPage 设为 1，数据缩减导致页码超界时组件也会回到有效页。

接口分页使用 `pagination-mode="server"`：传入接口返回的当前页数据和 `total`，组件不再次切片。监听 `page-change`（参数 `{ currentPage, pageSize }`）请求数据；修改每页条数会回到第一页。

```vue
<CrmTable
  v-model:current-page="currentPage"
  v-model:page-size="pageSize"
  :data="rows"
  :columns="columns"
  :total="total"
  :loading="loading"
  pagination-mode="server"
  row-key="userId"
  @page-change="loadPage"
/>
```

完整业务配置示例见 `crm_app/apps/system/src/views/users/config.ts` 和 `crm_app/apps/customer/src/views/customers/config.ts`。页面目前仍未接列表接口，实际空数组会显示空状态；组件不会生成模拟业务数据。
