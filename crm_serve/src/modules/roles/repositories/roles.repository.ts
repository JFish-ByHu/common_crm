import { Injectable } from '@nestjs/common'
import { RoleErrors } from '@common-crm/errors'
import { Prisma } from '@prisma/client'
import { currentTimestamp, BusinessError } from '../../../common'
import { PrismaService } from '../../../database'
import { RolesError } from '../roles.error'
import { RoleStatus, type CreateRoleInput, type RoleSearch, type UpdateRoleInput } from '../types'

const roleSelect = {
  isSystem: true,
  roleId: true,
  roleName: true,
  roleCode: true,
  roleStatus: true,
  remark: true,
  createTime: true,
  updateTime: true,
  _count: { select: { users: true } }
} satisfies Prisma.CrmRoleSelect

const optionSelect = {
  isSystem: true,
  roleId: true,
  roleName: true,
  roleCode: true,
  roleStatus: true
} satisfies Prisma.CrmRoleSelect

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findList(search: RoleSearch) {
    return this.query(search, roleSelect)
  }

  findOptions(search: RoleSearch) {
    return this.query(search, optionSelect)
  }

  async findDetail(roleId: string) {
    const role = await this.prisma.readWithRetry(() =>
      this.prisma.crmRole.findUnique({ where: { roleId }, select: roleSelect })
    )
    if (!role) throw new RolesError('ROLE_NOT_FOUND')
    return role
  }

  create(input: CreateRoleInput) {
    const now = currentTimestamp()
    return this.write(() =>
      this.prisma.crmRole.create({
        data: { ...input, createTime: now, updateTime: now },
        select: roleSelect
      })
    )
  }

  update(roleId: string, input: UpdateRoleInput) {
    return this.write(() =>
      this.prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM crm_authorization_state WHERE id = 1 FOR UPDATE`
        const role = await tx.crmRole.findUnique({ where: { roleId } })
        if (role?.isSystem) throw new BusinessError(RoleErrors.SYSTEM_ROLE_IMMUTABLE)
        const result = await tx.crmRole.update({
          where: { roleId },
          data: { ...input, updateTime: currentTimestamp() },
          select: roleSelect
        })
        await tx.crmAuthorizationState.update({
          where: { id: 1 },
          data: { revision: { increment: 1 } }
        })
        return result
      })
    )
  }

  /** 角色仍有成员时禁止删除；整批校验和删除放在同一事务。 */
  deleteMany(roleIds: string[]) {
    return this.write(() =>
      this.prisma.$transaction(async transaction => {
        await transaction.$queryRaw`SELECT id FROM crm_authorization_state WHERE id = 1 FOR UPDATE`
        if (await transaction.crmRole.count({ where: { roleId: { in: roleIds }, isSystem: true } }))
          throw new BusinessError(RoleErrors.SYSTEM_ROLE_UNDELETABLE)
        const roles = await transaction.$queryRaw<{ roleId: string }[]>(Prisma.sql`
        SELECT roleId FROM crm_roles WHERE roleId IN (${Prisma.join(roleIds)}) ORDER BY roleId FOR UPDATE
      `)
        if (roles.length !== roleIds.length) throw new RolesError('ROLE_NOT_FOUND')
        const assigned = await transaction.crmUserRole.count({ where: { roleId: { in: roleIds } } })
        if (assigned) throw new RolesError('ROLE_IN_USE')
        const result = await transaction.crmRole.deleteMany({ where: { roleId: { in: roleIds } } })
        await transaction.crmAuthorizationState.update({
          where: { id: 1 },
          data: { revision: { increment: 1 } }
        })
        return { deletedCount: result.count }
      })
    )
  }

  async findUserRoles(userId: string) {
    const user = await this.prisma.readWithRetry(() =>
      this.prisma.crmUser.findUnique({
        where: { userId },
        select: {
          userId: true,
          roles: { select: { role: { select: optionSelect } }, orderBy: { roleId: 'asc' } }
        }
      })
    )
    if (!user) throw new RolesError('USER_NOT_FOUND')
    return { userId, roles: user.roles.map(item => item.role) }
  }

  /** 完整替换用户角色；同一用户并发分配串行执行，失败时整体回滚。 */
  assignUserRoles(userId: string, roleIds: string[]) {
    return this.write(() =>
      this.prisma.$transaction(async transaction => {
        await transaction.$queryRaw`SELECT id FROM crm_authorization_state WHERE id = 1 FOR UPDATE`
        const systemRoles = await transaction.crmRole.findMany({
          where: { isSystem: true },
          select: { roleId: true, users: { where: { userId }, select: { userId: true } } }
        })
        if (systemRoles.some(role => roleIds.includes(role.roleId) !== role.users.length > 0))
          throw new BusinessError(RoleErrors.SYSTEM_ROLE_MEMBERS_PROTECTED)
        const users = await transaction.$queryRaw<{ userId: string }[]>`
        SELECT userId FROM crm_users WHERE userId = ${userId} FOR UPDATE
      `
        if (!users.length) throw new RolesError('USER_NOT_FOUND')
        const assigned = await transaction.crmUserRole.findMany({
          where: { userId },
          select: { roleId: true }
        })
        const assignedIds = new Set(assigned.map(item => item.roleId))
        if (roleIds.length) {
          const roles = await transaction.$queryRaw<
            { roleId: string; roleStatus: number }[]
          >(Prisma.sql`
          SELECT roleId, roleStatus FROM crm_roles
          WHERE roleId IN (${Prisma.join(roleIds)}) ORDER BY roleId FOR UPDATE
        `)
          if (roles.length !== roleIds.length) throw new RolesError('ROLE_NOT_FOUND')
          if (
            roles.some(
              role => role.roleStatus !== RoleStatus.ACTIVE && !assignedIds.has(role.roleId)
            )
          ) {
            throw new RolesError('ROLE_DISABLED')
          }
        }
        await transaction.crmUserRole.deleteMany({ where: { userId, roleId: { notIn: roleIds } } })
        const newRoleIds = roleIds.filter(roleId => !assignedIds.has(roleId))
        if (newRoleIds.length) {
          const now = currentTimestamp()
          await transaction.crmUserRole.createMany({
            data: newRoleIds.map(roleId => ({ userId, roleId, createTime: now }))
          })
        }
        const roles = await transaction.crmRole.findMany({
          where: { roleId: { in: roleIds } },
          select: optionSelect,
          orderBy: { roleId: 'asc' }
        })
        await transaction.crmAuthorizationState.update({
          where: { id: 1 },
          data: { revision: { increment: 1 } }
        })
        return { userId, roles }
      })
    )
  }

  private async query<Select extends Prisma.CrmRoleSelect>(search: RoleSearch, select: Select) {
    const where: Prisma.CrmRoleWhereInput = {
      roleStatus: search.roleStatus,
      ...(search.keyword
        ? {
            OR: [
              { roleId: { contains: search.keyword } },
              { roleName: { contains: search.keyword } },
              { roleCode: { contains: search.keyword } }
            ]
          }
        : {})
    }
    const page = search.pagination
    const [list, total] = await this.prisma.readWithRetry(() =>
      this.prisma.$transaction(
        [
          this.prisma.crmRole.findMany({
            where,
            select,
            orderBy: [{ createTime: 'desc' }, { roleId: 'asc' }],
            ...(page ? { skip: (page.page - 1) * page.pageSize, take: page.pageSize } : {})
          }),
          this.prisma.crmRole.count({ where })
        ],
        { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
      )
    )
    return { list, total, page: page?.page ?? null, pageSize: page?.pageSize ?? null }
  }

  private async write<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') throw new RolesError('ROLE_CONFLICT')
        if (error.code === 'P2025') throw new RolesError('ROLE_NOT_FOUND')
        if (error.code === 'P2003') throw new RolesError('ROLE_IN_USE')
      }
      throw error
    }
  }
}
