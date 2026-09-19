import type { Component } from 'vue'
import * as ElementPlusIcons from '@element-plus/icons-vue'

const icons = ElementPlusIcons as Record<string, Component>

/** Element Plus 使用 SVG 组件；兼容页面传入名称或旧式 el-icon-* 名称。 */
export function resolveTableIcon(icon?: string | Component): Component | undefined {
  if (typeof icon !== 'string') return icon
  const name = icon.startsWith('el-icon-')
    ? icon
        .slice(8)
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('')
    : icon
  return icons[name]
}
