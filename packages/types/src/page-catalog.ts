/** Compiled frontend capabilities. Permission codes and grants are configured in the database. */
export const pageCatalog = [
  {
    key: 'system-users',
    title: '用户管理',
    basePath: '/system',
    defaultPath: '/system/users'
  },
  {
    key: 'system-roles',
    title: '角色管理',
    basePath: '/system',
    defaultPath: '/system/roles'
  },
  {
    key: 'system-menus',
    title: '菜单管理',
    basePath: '/system',
    defaultPath: '/system/menus'
  },
  {
    key: 'customer-list',
    title: '客户管理',
    basePath: '/customer',
    defaultPath: '/customer'
  }
] as const
