import type {
  ApiPermissionRule,
  AssignRolePermissionsRequest,
  CurrentAuthorization,
  DeleteCountResponse,
  MenuActionInput,
  MenuActionItem,
  MenuInput,
  MenuItem,
  RolePermissions
} from '@common-crm/types/api'
import { request } from '../core'
import type { ApiQueryConfig, ApiResponse } from '../types'

export type {
  ApiPermissionRule,
  AssignRolePermissionsRequest,
  CurrentAuthorization,
  MenuActionInput,
  MenuActionItem,
  MenuInput,
  MenuItem,
  RolePermissions
} from '@common-crm/types/api'

/** 查询菜单树。 */
export const queryMenuTree = (config: ApiQueryConfig = {}): Promise<ApiResponse<MenuItem[]>> =>
  request<MenuItem[]>({
    ...config,
    url: '/menus/tree',
    method: 'get'
  })

/** 查询可配置权限绑定的接口清单。 */
export const queryPermissionEndpoints = (
  config: ApiQueryConfig = {}
): Promise<ApiResponse<ApiPermissionRule[]>> =>
  request<ApiPermissionRule[]>({
    ...config,
    url: '/menus/endpoints',
    method: 'get'
  })

/** 创建菜单。 */
export const createMenu = (data: MenuInput): Promise<ApiResponse<null>> =>
  request<null, MenuInput>({
    url: '/menus/create',
    method: 'post',
    data
  })

/** 编辑菜单。 */
export const updateMenu = (data: MenuInput & { menuId: string }): Promise<ApiResponse<null>> =>
  request<null, MenuInput & { menuId: string }>({
    url: '/menus/update',
    method: 'patch',
    data
  })

/** 删除单个菜单，参数通过 JSON 请求体提交。 */
export const deleteMenu = (menuId: string): Promise<ApiResponse<DeleteCountResponse>> =>
  request<DeleteCountResponse, { menuId: string }>({
    url: '/menus/delete',
    method: 'delete',
    data: { menuId }
  })

/** 批量删除菜单，参数通过 JSON 请求体提交。 */
export const batchDeleteMenus = (menuIds: string[]): Promise<ApiResponse<DeleteCountResponse>> =>
  request<DeleteCountResponse, { menuIds: string[] }>({
    url: '/menus/batchDelete',
    method: 'delete',
    data: { menuIds }
  })

/** 查询菜单下的按钮权限。 */
export const queryMenuActions = (
  menuId: string,
  config: ApiQueryConfig = {}
): Promise<ApiResponse<MenuActionItem[]>> =>
  request<MenuActionItem[]>({
    ...config,
    url: '/menus/actions/list',
    method: 'get',
    params: { menuId }
  })

/** 创建菜单按钮权限及接口绑定。 */
export const createMenuAction = (
  data: MenuActionInput
): Promise<ApiResponse<{ actionId: string }>> =>
  request<{ actionId: string }, MenuActionInput>({
    url: '/menus/actions/create',
    method: 'post',
    data
  })

/** 编辑菜单按钮权限及接口绑定。 */
export const updateMenuAction = (
  data: MenuActionInput & { actionId: string }
): Promise<ApiResponse<{ actionId: string }>> =>
  request<{ actionId: string }, MenuActionInput & { actionId: string }>({
    url: '/menus/actions/update',
    method: 'patch',
    data
  })

/** 删除菜单按钮权限，参数通过 JSON 请求体提交。 */
export const deleteMenuAction = (actionId: string): Promise<ApiResponse<DeleteCountResponse>> =>
  request<DeleteCountResponse, { actionId: string }>({
    url: '/menus/actions/delete',
    method: 'delete',
    data: { actionId }
  })

/** 查询角色可分配的菜单与按钮权限树。 */
export const queryRolePermissionTree = (
  config: ApiQueryConfig = {}
): Promise<ApiResponse<MenuItem[]>> =>
  request<MenuItem[]>({
    ...config,
    url: '/roles/permissionTree',
    method: 'get'
  })

/** 查询角色已分配的权限及配置版本。 */
export const queryRolePermissions = (
  roleId: string,
  config: ApiQueryConfig = {}
): Promise<ApiResponse<RolePermissions>> =>
  request<RolePermissions>({
    ...config,
    url: '/roles/permissions',
    method: 'get',
    params: { roleId }
  })

/** 完整替换角色权限，使用 revision 防止覆盖其他人的修改。 */
export const assignRolePermissions = (
  data: AssignRolePermissionsRequest
): Promise<ApiResponse<{ roleId: string }>> =>
  request<{ roleId: string }, AssignRolePermissionsRequest>({
    url: '/roles/updatePermissions',
    method: 'patch',
    data
  })

/** 查询当前用户的动态菜单与有效权限。 */
export const queryCurrentAuthorization = (
  config: ApiQueryConfig = {}
): Promise<ApiResponse<CurrentAuthorization>> =>
  request<CurrentAuthorization>({
    ...config,
    url: '/authorization/current',
    method: 'get'
  })
