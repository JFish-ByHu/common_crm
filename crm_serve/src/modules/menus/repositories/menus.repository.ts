import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { randomUUID } from 'node:crypto'
import type {
  AssignRolePermissionsRequest,
  MenuActionInput,
  MenuInput
} from '@common-crm/types/api'
import { currentTimestamp } from '../../../common'
import { PrismaService } from '../../../database'
import { rejectPermissionInput } from '../menus.error'

const menuInclude = {
  actions: {
    include: { rules: true },
    orderBy: [{ sortOrder: 'asc' as const }, { actionId: 'asc' as const }]
  }
}

@Injectable()
export class MenusRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.readWithRetry(() =>
      this.prisma.crmMenu.findMany({
        include: menuInclude,
        orderBy: [{ sortOrder: 'asc' }, { menuId: 'asc' }]
      })
    )
  }

  async findRolePermissions(roleId: string) {
    return this.prisma.$transaction(
      async tx => {
        const role = await tx.crmRole.findUnique({
          where: { roleId },
          include: { menus: true, actions: true }
        })
        if (!role) return rejectPermissionInput('角色不存在', 404)
        const state = await tx.crmAuthorizationState.findUniqueOrThrow({ where: { id: 1 } })
        return {
          roleId,
          menuIds: role.menus.map(item => item.menuId),
          actionIds: role.actions.map(item => item.actionId),
          revision: state.revision.toString(),
          isSystem: role.isSystem
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
    )
  }

  saveMenu(
    input: MenuInput,
    actorId: string,
    menuId = `crm_menu_${randomUUID()}`,
    creating = true
  ) {
    return this.mutate(
      actorId,
      creating ? 'createMenu' : 'updateMenu',
      menuId,
      async tx => {
        const menus = await tx.crmMenu.findMany()
        const previous = menus.find(item => item.menuId === menuId)
        const protectedIds = new Set<string>()
        let protectedNode = menus.find(item => item.componentKey === 'system-menus')
        while (protectedNode) {
          protectedIds.add(protectedNode.menuId)
          const nextId = protectedNode.parentId
          protectedNode = menus.find(item => item.menuId === nextId)
        }
        if (protectedIds.has(menuId) && (!input.enabled || !input.visible))
          rejectPermissionInput('菜单管理及其上级目录必须保持启用和显示')
        if (
          previous?.componentKey === 'system-menus' &&
          (input.componentKey !== 'system-menus' || input.menuType !== 'PAGE')
        )
          rejectPermissionInput('菜单管理入口不能更换组件或类型')
        if (!creating && !previous) rejectPermissionInput('菜单不存在', 404)
        if (
          previous &&
          previous.menuType !== input.menuType &&
          (menus.some(item => item.parentId === menuId) ||
            (await tx.crmMenuAction.count({ where: { menuId } })))
        ) {
          rejectPermissionInput('存在子项的菜单不能更改类型')
        }
        let parentId = input.parentId
        const visited = new Set([menuId])
        while (parentId) {
          if (visited.has(parentId)) rejectPermissionInput('父级不能是自身或后代菜单')
          visited.add(parentId)
          const parent = menus.find(item => item.menuId === parentId)
          if (!parent || parent.menuType !== 'DIRECTORY')
            return rejectPermissionInput('父级必须是已存在的目录')
          if (protectedIds.has(menuId) && (!parent.enabled || !parent.visible))
            rejectPermissionInput('菜单管理入口不能移动到停用或隐藏的目录')
          parentId = parent.parentId
        }
        if (await tx.crmMenuAction.count({ where: { permissionCode: input.permissionCode } }))
          rejectPermissionInput('权限标识已被按钮使用', 409)
        const now = currentTimestamp()
        return creating
          ? tx.crmMenu.create({ data: { ...input, menuId, createTime: now, updateTime: now } })
          : tx.crmMenu.update({ where: { menuId }, data: { ...input, updateTime: now } })
      },
      input
    )
  }

  deleteMenus(menuIds: string[], actorId: string) {
    return this.mutate(
      actorId,
      'deleteMenus',
      menuIds[0],
      async tx => {
        if ((await tx.crmMenu.count({ where: { menuId: { in: menuIds } } })) !== menuIds.length)
          rejectPermissionInput('菜单不存在', 404)
        if (
          await tx.crmMenu.count({
            where: { menuId: { in: menuIds }, componentKey: 'system-menus' }
          })
        )
          rejectPermissionInput('菜单管理入口不能删除')
        // Even selected descendants must be explicitly removed first; never silently cascade a tree.
        if (
          (await tx.crmMenu.count({ where: { parentId: { in: menuIds } } })) ||
          (await tx.crmMenuAction.count({ where: { menuId: { in: menuIds } } }))
        )
          rejectPermissionInput('请先删除目录下的菜单和按钮权限', 409)
        const result = await tx.crmMenu.deleteMany({ where: { menuId: { in: menuIds } } })
        return { deletedCount: result.count }
      },
      { menuIds }
    )
  }

  saveAction(
    input: MenuActionInput,
    actorId: string,
    actionId = `crm_action_${randomUUID()}`,
    creating = true
  ) {
    return this.mutate(
      actorId,
      creating ? 'createAction' : 'updateAction',
      actionId,
      async tx => {
        const { rules, ...data } = input
        const menu = await tx.crmMenu.findUnique({ where: { menuId: data.menuId } })
        if (!menu || menu.menuType !== 'PAGE') rejectPermissionInput('按钮必须属于页面菜单')
        if (!creating) {
          const previous = await tx.crmMenuAction.findUnique({ where: { actionId } })
          if (!previous) return rejectPermissionInput('按钮不存在', 404)
          if (previous.menuId !== data.menuId)
            rejectPermissionInput('按钮不可移动到其他菜单，请重新创建')
        }
        if (await tx.crmMenu.count({ where: { permissionCode: data.permissionCode } }))
          rejectPermissionInput('权限标识已被菜单使用', 409)
        const now = currentTimestamp()
        if (creating)
          await tx.crmMenuAction.create({
            data: { ...data, actionId, createTime: now, updateTime: now }
          })
        else
          await tx.crmMenuAction.update({ where: { actionId }, data: { ...data, updateTime: now } })
        await tx.crmApiPermissionRule.deleteMany({ where: { actionId } })
        if (rules.length)
          await tx.crmApiPermissionRule.createMany({
            data: rules.map(rule => ({ ...rule, actionId, ruleId: `crm_rule_${randomUUID()}` }))
          })
        return { actionId }
      },
      input
    )
  }

  deleteAction(actionId: string, actorId: string) {
    return this.mutate(
      actorId,
      'deleteAction',
      actionId,
      async tx => {
        await tx.crmMenuAction.delete({ where: { actionId } })
        return { deletedCount: 1 }
      },
      { actionId }
    )
  }

  assignPermissions(input: AssignRolePermissionsRequest, actorId: string) {
    return this.mutate(
      actorId,
      'assignRolePermissions',
      input.roleId,
      async tx => {
        const state = await tx.crmAuthorizationState.findUniqueOrThrow({ where: { id: 1 } })
        if (state.revision.toString() !== input.revision)
          rejectPermissionInput('权限配置已变更，请重新加载后保存', 409)
        const role = await tx.crmRole.findUnique({ where: { roleId: input.roleId } })
        if (!role) return rejectPermissionInput('角色不存在', 404)
        if (role.isSystem) rejectPermissionInput('系统管理角色固定拥有全部权限，不能修改', 403)
        const menus = await tx.crmMenu.findMany()
        const actions = await tx.crmMenuAction.findMany({
          where: { actionId: { in: input.actionIds } }
        })
        if (actions.length !== input.actionIds.length) rejectPermissionInput('包含不存在的按钮权限')
        const menuIds = new Set(input.menuIds)
        actions.forEach(action => menuIds.add(action.menuId))
        for (const id of menuIds) {
          const menu = menus.find(item => item.menuId === id)
          if (!menu) return rejectPermissionInput('包含不存在的菜单')
          if (menu.parentId) menuIds.add(menu.parentId)
        }
        await tx.crmRoleMenu.deleteMany({ where: { roleId: input.roleId } })
        await tx.crmRoleMenuAction.deleteMany({ where: { roleId: input.roleId } })
        if (menuIds.size)
          await tx.crmRoleMenu.createMany({
            data: [...menuIds].map(menuId => ({ roleId: input.roleId, menuId }))
          })
        if (input.actionIds.length)
          await tx.crmRoleMenuAction.createMany({
            data: input.actionIds.map(actionId => ({ roleId: input.roleId, actionId }))
          })
        return { roleId: input.roleId }
      },
      input
    )
  }

  private async mutate<T>(
    actorId: string,
    operation: string,
    targetId: string,
    change: (tx: Prisma.TransactionClient) => Promise<T>,
    detail: object
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM crm_authorization_state WHERE id = 1 FOR UPDATE`
        const result = await change(tx)
        await tx.crmAuthorizationState.update({
          where: { id: 1 },
          data: { revision: { increment: 1 } }
        })
        await tx.crmPermissionAudit.create({
          data: {
            auditId: `crm_audit_${randomUUID()}`,
            actorId,
            operation,
            targetId,
            detail: detail as Prisma.InputJsonObject,
            createTime: currentTimestamp()
          }
        })
        return result
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') rejectPermissionInput('权限标识、路由、组件或接口绑定重复', 409)
        if (error.code === 'P2025') rejectPermissionInput('记录不存在', 404)
        if (error.code === 'P2003') rejectPermissionInput('仍存在关联记录，请刷新后重试', 409)
      }
      throw error
    }
  }
}
