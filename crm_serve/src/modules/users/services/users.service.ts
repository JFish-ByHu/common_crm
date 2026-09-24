import { Injectable } from '@nestjs/common'
import { hash } from 'bcryptjs'
import {
  createUserId,
  formatApiDateTime,
  parseBinaryStatus,
  resolvePagination
} from '../../../common'
import type {
  DeleteUsersResponse,
  LogoutUserResponse,
  UserListResponse,
  UserSelectItem
} from '@common-crm/types/api'
import type { CreateUserDto, UpdateUserDto, UserListQueryDto, UserOptionsQueryDto } from '../dto'
import {
  AccountStatus,
  type AccountStatusValue,
  type StoredUserListItem,
  type UserListItem
} from '../types'
import { UsersError } from '../users.error'
import { UsersRepository } from '../repositories'
import { AuthSessionRepository } from '../../auth'
import { PresenceService, type UserOnlineStatus, type UserPresenceItem } from '../../presence'

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly presenceService: PresenceService
  ) {}

  async findList(query: UserListQueryDto): Promise<UserListResponse> {
    const result = await this.usersRepository.findList({
      keyword: query.keyword,
      accountStatus: query.accountStatus,
      pagination: resolvePagination(query, () => new UsersError('INVALID_INPUT'))
    })
    const statuses = await this.queryPresence(result.list)
    return {
      ...result,
      list: result.list.map(user => toUserListItem(user, statuses.get(user.userId) ?? null))
    }
  }

  async queryOnlineStatus(userIds: string[]): Promise<UserPresenceItem[]> {
    const users = await this.usersRepository.findAccountsForPresence(userIds)
    const statuses = await this.queryPresence(users)
    return users.map(user => ({
      userId: user.userId,
      onlineStatus: statuses.get(user.userId) ?? null
    }))
  }

  async findOptions(query: UserOptionsQueryDto): Promise<UserListResponse<UserSelectItem>> {
    const result = await this.usersRepository.findOptions({
      username: query.username,
      pagination: resolvePagination(query, () => new UsersError('INVALID_INPUT'))
    })
    return {
      ...result,
      list: result.list.map(user => ({
        ...user,
        accountStatus: parseBinaryStatus(user.accountStatus)
      }))
    }
  }

  async create(command: CreateUserDto): Promise<UserListItem> {
    const user = await this.usersRepository.create({
      userId: createUserId(),
      username: command.username,
      email: command.email ?? null,
      passwordHash: await hash(command.password, 12),
      accountStatus: command.accountStatus ?? AccountStatus.ACTIVE
    })
    return toUserListItem(user, 0)
  }

  async update(userId: string, command: UpdateUserDto, actorId?: string): Promise<UserListItem> {
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
    const user = await this.usersRepository.update(
      userId,
      {
        username: command.username,
        email: command.email,
        accountStatus: command.accountStatus,
        passwordHash: command.password === undefined ? undefined : await hash(command.password, 12)
      },
      actorId
    )
    await this.presenceService.removeSessions(sessionIds)
    const statuses = await this.queryPresence([user])
    return toUserListItem(user, statuses.get(userId) ?? null)
  }

  async updateStatus(userId: string, accountStatus: AccountStatusValue): Promise<UserListItem> {
    const sessionIds =
      accountStatus === AccountStatus.DISABLED
        ? await this.authSessionRepository.findSessionIdsByUsers([userId])
        : []
    const user = await this.usersRepository.updateStatus(userId, accountStatus)
    await this.presenceService.removeSessions(sessionIds)
    const statuses = await this.queryPresence([user])
    return toUserListItem(user, statuses.get(userId) ?? null)
  }

  async delete(userId: string): Promise<DeleteUsersResponse> {
    const sessionIds = await this.authSessionRepository.findSessionIdsByUsers([userId])
    const result = await this.usersRepository.delete(userId)
    await this.presenceService.removeSessions(sessionIds)
    return result
  }

  async deleteMany(userIds: string[]): Promise<DeleteUsersResponse> {
    const sessionIds = await this.authSessionRepository.findSessionIdsByUsers(userIds)
    const result = await this.usersRepository.deleteMany(userIds)
    await this.presenceService.removeSessions(sessionIds)
    return result
  }

  /** 强制指定用户退出全部登录会话。 */
  async logout(userId: string): Promise<LogoutUserResponse> {
    const sessionIds = await this.authSessionRepository.revokeByUsers([userId], new Date())
    await this.presenceService.removeSessions(sessionIds)
    return { revokedCount: sessionIds.length }
  }

  private async queryPresence(users: { userId: string; accountStatus: number }[]) {
    const statuses = new Map<string, UserOnlineStatus>(users.map(user => [user.userId, 0]))
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
}

const toUserListItem = (
  user: StoredUserListItem,
  onlineStatus: UserOnlineStatus
): UserListItem => ({
  ...user,
  accountStatus: parseBinaryStatus(user.accountStatus),
  onlineStatus,
  createTime: formatApiDateTime(user.createTime),
  updateTime: formatApiDateTime(user.updateTime)
})
