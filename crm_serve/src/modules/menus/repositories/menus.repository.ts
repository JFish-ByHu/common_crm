import { MenuErrors, RoleErrors } from '@common-crm/errors'
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
        if (!role) return rejectPermissionInput(RoleErrors.ROLE_NOT_FOUND)
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
        const routeShape = (path: string) => path.replace(/:[a-zA-Z][a-zA-Z0-9_]*/g, ':param')
        if (
          input.routePath &&
          menus.some(
            menu =>
              menu.menuId !== menuId &&
              menu.routePath &&
              routeShape(menu.routePath) === routeShape(input.routePath!)
          )
        )
          rejectPermissionInput(MenuErrors.ROUTE_CONFLICT)
        const previous = menus.find(item => item.menuId === menuId)
        const protectedIds = new Set<string>()
        let protectedNode = menus.find(item => item.componentKey === 'system-menus')
        while (protectedNode) {
          protectedIds.add(protectedNode.menuId)
          const nextId = protectedNode.parentId
          protectedNode = menus.find(item => item.menuId === nextId)
        }
        if (protectedIds.has(menuId) && (!input.enabled || !input.visible))
          rejectPermissionInput(MenuErrors.PROTECTED_MENU_VISIBLE)
        if (
          previous?.componentKey === 'system-menus' &&
          (input.componentKey !== 'system-menus' || input.menuType !== 'PAGE' || !input.routePath)
        )
          rejectPermissionInput(MenuErrors.PROTECTED_ENTRY)
        if (!creating && !previous) rejectPermissionInput(MenuErrors.MENU_NOT_FOUND)
        if (
          previous &&
          previous.menuType !== input.menuType &&
          (menus.some(item => item.parentId === menuId) ||
            (await tx.crmMenuAction.count({ where: { menuId } })))
        ) {
          rejectPermissionInput(MenuErrors.MENU_TYPE_IN_USE)
        }
        let parentId = input.parentId
        const visited = new Set([menuId])
        while (parentId) {
          if (visited.has(parentId)) rejectPermissionInput(MenuErrors.PARENT_CYCLE)
          visited.add(parentId)
          const parent = menus.find(item => item.menuId === parentId)
          if (!parent || parent.menuType !== 'DIRECTORY')
            return rejectPermissionInput(MenuErrors.INVALID_PARENT)
          if (protectedIds.has(menuId) && (!parent.enabled || !parent.visible))
            rejectPermissionInput(MenuErrors.PROTECTED_PARENT)
          parentId = parent.parentId
        }
        if (await tx.crmMenuAction.count({ where: { permissionCode: input.permissionCode } }))
          rejectPermissionInput(MenuErrors.CODE_USED_BY_ACTION)
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
          rejectPermissionInput(MenuErrors.MENU_NOT_FOUND)
        if (
          await tx.crmMenu.count({
            where: { menuId: { in: menuIds }, componentKey: 'system-menus' }
          })
        )
          rejectPermissionInput(MenuErrors.PROTECTED_DELETE)
        // Even selected descendants must be explicitly removed first; never silently cascade a tree.
        if (
          (await tx.crmMenu.count({ where: { parentId: { in: menuIds } } })) ||
          (await tx.crmMenuAction.count({ where: { menuId: { in: menuIds } } }))
        )
          rejectPermissionInput(MenuErrors.MENU_IN_USE)
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
        if (!menu || menu.menuType !== 'PAGE')
          rejectPermissionInput(MenuErrors.ACTION_REQUIRES_PAGE)
        if (!creating) {
          const previous = await tx.crmMenuAction.findUnique({ where: { actionId } })
          if (!previous) return rejectPermissionInput(MenuErrors.ACTION_NOT_FOUND)
          if (previous.menuId !== data.menuId)
            rejectPermissionInput(MenuErrors.ACTION_MOVE_FORBIDDEN)
        }
        if (await tx.crmMenu.count({ where: { permissionCode: data.permissionCode } }))
          rejectPermissionInput(MenuErrors.CODE_USED_BY_MENU)
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
          rejectPermissionInput(MenuErrors.REVISION_CONFLICT)
        const role = await tx.crmRole.findUnique({ where: { roleId: input.roleId } })
        if (!role) return rejectPermissionInput(RoleErrors.ROLE_NOT_FOUND)
        if (role.isSystem) rejectPermissionInput(MenuErrors.SYSTEM_GRANTS_IMMUTABLE)
        const menus = await tx.crmMenu.findMany()
        const actions = await tx.crmMenuAction.findMany({
          where: { actionId: { in: input.actionIds } }
        })
        if (actions.length !== input.actionIds.length)
          rejectPermissionInput(MenuErrors.UNKNOWN_ACTIONS)
        const menuIds = new Set(input.menuIds)
        actions.forEach(action => menuIds.add(action.menuId))
        for (const id of menuIds) {
          const menu = menus.find(item => item.menuId === id)
          if (!menu) return rejectPermissionInput(MenuErrors.UNKNOWN_MENUS)
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
        if (error.code === 'P2002') rejectPermissionInput(MenuErrors.BINDING_CONFLICT)
        if (error.code === 'P2025') rejectPermissionInput(MenuErrors.RECORD_NOT_FOUND)
        if (error.code === 'P2003') rejectPermissionInput(MenuErrors.RECORD_IN_USE)
      }
      throw error
    }
  }
}
