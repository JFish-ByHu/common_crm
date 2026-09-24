import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { currentTimestamp } from '../../common'
import { PrismaService } from '../../database'
import { UsersError } from './users.error'
import {
  AccountStatus,
  type AccountStatusValue,
  type CreateUserInput,
  type StoredUserListItem,
  type UpdateUserInput,
  type UserListResult,
  type UserOption,
  type UserSearch
} from './types'

const userSelect = {
  userId: true,
  username: true,
  email: true,
  accountStatus: true,
  createTime: true,
  updateTime: true
} satisfies Prisma.CrmUserSelect

const optionSelect = {
  userId: true,
  username: true,
  accountStatus: true
} satisfies Prisma.CrmUserSelect

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAccountsForPresence(userIds: string[]) {
    return this.prisma.readWithRetry(() =>
      this.prisma.crmUser.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, accountStatus: true }
      })
    )
  }

  /** 查询公开用户字段，并在同一快照中统计匹配总数。 */
  findList(search: UserSearch): Promise<UserListResult<StoredUserListItem>> {
    return this.query(search, userSelect)
  }

  /** 下拉接口在数据库查询阶段就只选择三个公开字段。 */
  findOptions(search: UserSearch): Promise<UserListResult<UserOption>> {
    return this.query(search, optionSelect)
  }

  create(input: CreateUserInput): Promise<StoredUserListItem> {
    return this.write(() => {
      const now = currentTimestamp()
      return this.prisma.crmUser.create({
        data: {
          userId: input.userId,
          username: input.username,
          email: input.email,
          password: input.passwordHash,
          accountStatus: input.accountStatus,
          createTime: now,
          updateTime: now
        },
        select: userSelect
      })
    })
  }

  /** 资料、账号状态与会话撤销使用同一事务，防止部分更新。 */
  update(userId: string, input: UpdateUserInput): Promise<StoredUserListItem> {
    return this.write(() =>
      this.prisma.$transaction(async transaction => {
        const now = currentTimestamp()
        const user = await transaction.crmUser.update({
          where: { userId },
          data: {
            username: input.username,
            email: input.email,
            password: input.passwordHash,
            accountStatus: input.accountStatus,
            updateTime: now
          },
          select: userSelect
        })
        if (input.passwordHash !== undefined || input.accountStatus === AccountStatus.DISABLED) {
          await transaction.crmAuthSession.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: now, updateTime: now }
          })
        }
        return user
      })
    )
  }

  /** 停用账号时撤销会话，重新启用也不会恢复旧 token。 */
  updateStatus(userId: string, accountStatus: AccountStatusValue): Promise<StoredUserListItem> {
    return this.write(() =>
      this.prisma.$transaction(async transaction => {
        const now = currentTimestamp()
        const user = await transaction.crmUser.update({
          where: { userId },
          data: { accountStatus, updateTime: now },
          select: userSelect
        })
        if (accountStatus === AccountStatus.DISABLED) {
          await transaction.crmAuthSession.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: now, updateTime: now }
          })
        }
        return user
      })
    )
  }

  /** 物理删除，关联会话由数据库外键 ON DELETE CASCADE 清理。 */
  delete(userId: string): Promise<{ deletedCount: number }> {
    return this.write(async () => {
      await this.prisma.crmUser.delete({ where: { userId }, select: { userId: true } })
      return { deletedCount: 1 }
    })
  }

  /** 批量删除全部成功或全部回滚，不静默忽略不存在的 ID。 */
  deleteMany(userIds: string[]): Promise<{ deletedCount: number }> {
    return this.write(() =>
      this.prisma.$transaction(async transaction => {
        const { count } = await transaction.crmUser.deleteMany({
          where: { userId: { in: userIds } }
        })
        if (count !== userIds.length) throw new UsersError('USER_NOT_FOUND')
        return { deletedCount: count }
      })
    )
  }

  private async query<Select extends Prisma.CrmUserSelect>(
    search: UserSearch,
    select: Select
  ): Promise<UserListResult<Prisma.CrmUserGetPayload<{ select: Select }>>> {
    const where: Prisma.CrmUserWhereInput = {
      accountStatus: search.accountStatus,
      ...(search.keyword
        ? {
            OR: [
              { userId: { contains: search.keyword } },
              { username: { contains: search.keyword } },
              { email: { contains: search.keyword } }
            ]
          }
        : {}),
      ...(search.username ? { username: { contains: search.username } } : {})
    }
    const pagination = search.pagination
    const [list, total] = await this.prisma.readWithRetry(() =>
      this.prisma.$transaction(
        [
          this.prisma.crmUser.findMany({
            where,
            select,
            orderBy: [{ createTime: 'desc' }, { userId: 'asc' }],
            ...(pagination
              ? { skip: (pagination.page - 1) * pagination.pageSize, take: pagination.pageSize }
              : {})
          }),
          this.prisma.crmUser.count({ where })
        ],
        { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
      )
    )
    return {
      list,
      total,
      page: pagination?.page ?? null,
      pageSize: pagination?.pageSize ?? null
    }
  }

  private async write<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') throw new UsersError('USER_CONFLICT')
        if (error.code === 'P2025') throw new UsersError('USER_NOT_FOUND')
      }
      throw error
    }
  }
}
