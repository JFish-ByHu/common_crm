import { request } from '../core'
import type { ApiRequestConfig } from '../types'
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

type QueryConfig = Pick<ApiRequestConfig, 'signal' | 'showProgress'>

export const queryMenuTree = (config: QueryConfig = {}) =>
  request<MenuItem[]>({ ...config, url: '/menus/tree', method: 'get' })
export const queryPermissionEndpoints = (config: QueryConfig = {}) =>
  request<ApiPermissionRule[]>({ ...config, url: '/menus/endpoints', method: 'get' })
export const createMenu = (data: MenuInput) =>
  request<null>({ url: '/menus/create', method: 'post', data })
export const updateMenu = (data: MenuInput & { menuId: string }) =>
  request<null>({ url: '/menus/update', method: 'patch', data })
export const deleteMenu = (menuId: string) =>
  request<DeleteCountResponse>({ url: '/menus/delete', method: 'delete', data: { menuId } })
export const batchDeleteMenus = (menuIds: string[]) =>
  request<DeleteCountResponse>({ url: '/menus/batchDelete', method: 'delete', data: { menuIds } })
export const queryMenuActions = (menuId: string) =>
  request<MenuActionItem[]>({ url: '/menus/actions/list', method: 'get', params: { menuId } })
export const createMenuAction = (data: MenuActionInput) =>
  request<{ actionId: string }>({ url: '/menus/actions/create', method: 'post', data })
export const updateMenuAction = (data: MenuActionInput & { actionId: string }) =>
  request<{ actionId: string }>({ url: '/menus/actions/update', method: 'patch', data })
export const deleteMenuAction = (actionId: string) =>
  request<DeleteCountResponse>({
    url: '/menus/actions/delete',
    method: 'delete',
    data: { actionId }
  })
export const queryRolePermissionTree = (config: QueryConfig = {}) =>
  request<MenuItem[]>({ ...config, url: '/roles/permissionTree', method: 'get' })
export const queryRolePermissions = (roleId: string, config: QueryConfig = {}) =>
  request<RolePermissions>({
    ...config,
    url: '/roles/permissions',
    method: 'get',
    params: { roleId }
  })
export const assignRolePermissions = (data: AssignRolePermissionsRequest) =>
  request<{ roleId: string }>({ url: '/roles/updatePermissions', method: 'patch', data })
export const queryCurrentAuthorization = (config: QueryConfig = {}) =>
  request<CurrentAuthorization>({
    ...config,
    url: '/authorization/current',
    method: 'get'
  })
