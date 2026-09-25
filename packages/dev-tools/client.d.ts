/** 编译器宏：只能在 script setup 顶层调用，参数必须为静态字面量。 */
declare const definePage: (definition: import('@common-crm/types/page').PageDefinition) => void

declare module 'virtual:crm-pages/catalog' {
  export const pageCatalog: import('@common-crm/types/page').PageCatalogEntry[]
}

declare module 'virtual:crm-pages/components' {
  export const pageComponents: Record<string, () => Promise<unknown>>
}
