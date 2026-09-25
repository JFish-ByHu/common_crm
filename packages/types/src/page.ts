/** definePage 的编译期声明；权限及最终菜单配置仍由后端管理。 */
export interface PageDefinition {
  /** 稳定组件标识，使用所属应用前缀，例如 system-users。 */
  key: string
  title: string
  defaultPath: string
  /** 新增菜单时的导航显示默认值；带参数的页面必须为 false。 */
  visible?: boolean
}

export interface PageCatalogEntry extends PageDefinition {
  app: string
  basePath: string
  /** 相对于子应用的文件路径。 */
  file: string
  visible: boolean
}
