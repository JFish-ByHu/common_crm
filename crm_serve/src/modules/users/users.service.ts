import { Injectable } from '@nestjs/common'
import { hash } from 'bcryptjs'
import { createUserId, formatApiDateTime } from '../../common'
import type {
  CreateUserDto,
  UpdateUserDto,
  UserListQueryDto,
  UserOptionsQueryDto,
  UserPaginationDto
} from './dto'
import {
  AccountStatus,
  type AccountStatusValue,
  type StoredUserListItem,
  type UserListItem,
  type UserPagination
} from './types'
import { UsersError } from './users.error'
import { UsersRepository } from './users.repository'
import {
  AuthSessionRepository,
  PresenceService,
  type OnlineStatus,
  type UserOnlineStatus
} from '../iam'

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly presenceService: PresenceService
  ) {}

  async findList(query: UserListQueryDto) {
    const result = await this.usersRepository.findList({
      keyword: query.keyword,
      accountStatus: query.accountStatus,
      pagination: this.pagination(query)
    })
    const statuses = await this.queryPresence(result.list)
    return {
      ...result,
      list: result.list.map(user => toUserListItem(user, statuses.get(user.userId) ?? null))
    }
  }

  async queryOnlineStatus(userIds: string[]): Promise<UserOnlineStatus[]> {
    const users = await this.usersRepository.findAccountsForPresence(userIds)
    const statuses = await this.queryPresence(users)
    return users.map(user => ({
      userId: user.userId,
      onlineStatus: statuses.get(user.userId) ?? null
    }))
  }

  findOptions(query: UserOptionsQueryDto) {
    return this.usersRepository.findOptions({
      username: query.username,
      pagination: this.pagination(query)
    })
  }

  async create(command: CreateUserDto) {
    const user = await this.usersRepository.create({
      userId: createUserId(),
      username: command.username,
      email: command.email ?? null,
      passwordHash: await hash(command.password, 12),
      accountStatus: command.accountStatus ?? AccountStatus.ACTIVE
    })
    return toUserListItem(user, 0)
  }

  async update(userId: string, command: UpdateUserDto) {
    if (
      command.username === undefined &&
      command.email === undefined &&
      command.password === undefined &&
      command.accountStatus === undefined
    ) {
      throw new UsersError('INVALID_INPUT')
    }
    const sessionIds =
      command.password !== undefined || command.accountStatus === AccountStatus.DISABLED
        ? await this.authSessionRepository.findSessionIdsByUsers([userId])
        : []
    const user = await this.usersRepository.update(userId, {
      username: command.username,
      email: command.email,
      accountStatus: command.accountStatus,
      passwordHash: command.password === undefined ? undefined : await hash(command.password, 12)
    })
    await this.presenceService.removeSessions(sessionIds)
    const statuses = await this.queryPresence([user])
    return toUserListItem(user, statuses.get(userId) ?? null)
  }

  async updateStatus(userId: string, accountStatus: AccountStatusValue) {
    const sessionIds =
      accountStatus === AccountStatus.DISABLED
        ? await this.authSessionRepository.findSessionIdsByUsers([userId])
        : []
    const user = await this.usersRepository.updateStatus(userId, accountStatus)
    await this.presenceService.removeSessions(sessionIds)
    const statuses = await this.queryPresence([user])
    return toUserListItem(user, statuses.get(userId) ?? null)
  }

  async delete(userId: string) {
    const sessionIds = await this.authSessionRepository.findSessionIdsByUsers([userId])
    const result = await this.usersRepository.delete(userId)
    await this.presenceService.removeSessions(sessionIds)
    return result
  }

  async deleteMany(userIds: string[]) {
    const sessionIds = await this.authSessionRepository.findSessionIdsByUsers(userIds)
    const result = await this.usersRepository.deleteMany(userIds)
    await this.presenceService.removeSessions(sessionIds)
    return result
  }

  /** 强制指定用户退出全部登录会话。 */
  async logout(userId: string) {
    const sessionIds = await this.authSessionRepository.revokeByUsers([userId], new Date())
    await this.presenceService.removeSessions(sessionIds)
    return { revokedCount: sessionIds.length }
  }

  private async queryPresence(users: { userId: string; accountStatus: number }[]) {
    const statuses = new Map<string, OnlineStatus>(users.map(user => [user.userId, 0]))
    const enabledIds = users
      .filter(user => user.accountStatus === AccountStatus.ACTIVE)
      .map(user => user.userId)
    for (let offset = 0; offset < enabledIds.length; offset += 100) {
      const sessions = await this.authSessionRepository.findActiveForUsers(
        enabledIds.slice(offset, offset + 100)
      )
      const sessionStatuses = await this.presenceService.querySessions(
        sessions.map(session => session.sessionId)
      )
      for (const session of sessions) {
        const status = sessionStatuses.get(session.sessionId) ?? null
        // 任一会话在线即可判在线；没有在线但存在查询失败的会话时为未知。
        if (status === 1 || (status === null && statuses.get(session.userId) !== 1)) {
          statuses.set(session.userId, status)
        }
      }
    }
    return statuses
  }

  private pagination(query: UserPaginationDto): UserPagination | undefined {
    if (query.page === undefined && query.pageSize === undefined) return undefined

    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    if ((page - 1) * pageSize > 2147483647) throw new UsersError('INVALID_INPUT')
    return { page, pageSize }
  }
}

const toUserListItem = (user: StoredUserListItem, onlineStatus: OnlineStatus): UserListItem => ({
  ...user,
  onlineStatus,
  createTime: formatApiDateTime(user.createTime),
  updateTime: formatApiDateTime(user.updateTime)
})
