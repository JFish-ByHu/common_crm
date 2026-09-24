import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { randomUUID } from 'node:crypto'
import type { ApiPermissionRule } from '@common-crm/types/api'
import { currentTimestamp } from '../../../common'
import { PrismaService } from '../../../database'
import { endpointKey } from '../types'

@Injectable()
export class AuthorizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** 仅删除失效接口映射，保留按钮配置和角色授权，审计与版本更新一起提交。 */
  deleteStaleEndpointRules(endpoints: ApiPermissionRule[]): Promise<number> {
    const registered = new Set(endpoints.map(endpointKey))
    return this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM crm_authorization_state WHERE id = 1 FOR UPDATE`
      const rules = await tx.crmApiPermissionRule.findMany()
      const staleRules = rules.filter(rule => !registered.has(endpointKey(rule)))
      if (!staleRules.length) return 0

      const result = await tx.crmApiPermissionRule.deleteMany({
        where: { ruleId: { in: staleRules.map(rule => rule.ruleId) } }
      })
      await tx.crmAuthorizationState.update({
        where: { id: 1 },
        data: { revision: { increment: 1 } }
      })
      await tx.crmPermissionAudit.create({
        data: {
          auditId: `crm_audit_${randomUUID()}`,
          actorId: 'system:route-catalog',
          operation: 'deleteStaleEndpointRules',
          targetId: 'endpoint-catalog',
          detail: { removedRules: staleRules },
          createTime: currentTimestamp()
        }
      })
      return result.count
    })
  }

  async findRevision() {
    const state = await this.prisma.readWithRetry(() =>
      this.prisma.crmAuthorizationState.findUniqueOrThrow({ where: { id: 1 } })
    )
    return state.revision.toString()
  }

  findUserPermissions(userId: string) {
    return this.prisma.readWithRetry(() =>
      this.prisma.$transaction(
        async tx => {
          const [roles, menus, user, state] = await Promise.all([
            tx.crmRole.findMany({
              where: { users: { some: { userId } } },
              include: { menus: true, actions: true },
              orderBy: [{ isSystem: 'desc' }, { roleName: 'asc' }, { roleId: 'asc' }]
            }),
            tx.crmMenu.findMany({
              include: { actions: { include: { rules: true }, orderBy: { sortOrder: 'asc' } } },
              orderBy: [{ sortOrder: 'asc' }, { menuId: 'asc' }]
            }),
            tx.crmUser.findUnique({
              where: { userId },
              select: { userId: true, username: true, accountStatus: true }
            }),
            tx.crmAuthorizationState.findUniqueOrThrow({ where: { id: 1 } })
          ])
          return { roles, menus, user, revision: state.revision.toString() }
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
      )
    )
  }
}
