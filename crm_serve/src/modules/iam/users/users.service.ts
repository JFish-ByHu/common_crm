import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { hash } from 'bcryptjs'
import { formatApiDateTime } from '../../../common'
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

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findList(query: UserListQueryDto) {
    const result = await this.usersRepository.findList({
      keyword: query.keyword,
      accountStatus: query.accountStatus,
      pagination: this.pagination(query)
    })
    return { ...result, list: result.list.map(toUserListItem) }
  }

  findOptions(query: UserOptionsQueryDto) {
    return this.usersRepository.findOptions({
      username: query.username,
      pagination: this.pagination(query)
    })
  }

  async create(command: CreateUserDto) {
    const user = await this.usersRepository.create({
      userId: randomUUID(),
      username: command.username,
      email: command.email ?? null,
      passwordHash: await hash(command.password, 12),
      accountStatus: command.accountStatus ?? AccountStatus.ACTIVE
    })
    return toUserListItem(user)
  }

  async update(userId: string, command: UpdateUserDto) {
    if (
      command.username === undefined &&
      command.email === undefined &&
      command.password === undefined
    ) {
      throw new UsersError('INVALID_INPUT')
    }
    const user = await this.usersRepository.update(userId, {
      username: command.username,
      email: command.email,
      passwordHash: command.password === undefined ? undefined : await hash(command.password, 12)
    })
    return toUserListItem(user)
  }

  async updateStatus(userId: string, accountStatus: AccountStatusValue) {
    return toUserListItem(await this.usersRepository.updateStatus(userId, accountStatus))
  }

  delete(userId: string) {
    return this.usersRepository.delete(userId)
  }

  deleteMany(userIds: string[]) {
    return this.usersRepository.deleteMany(userIds)
  }

  private pagination(query: UserPaginationDto): UserPagination | undefined {
    if (query.page === undefined && query.pageSize === undefined) return undefined

    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    if ((page - 1) * pageSize > 2147483647) throw new UsersError('INVALID_INPUT')
    return { page, pageSize }
  }
}

const toUserListItem = (user: StoredUserListItem): UserListItem => ({
  ...user,
  createTime: formatApiDateTime(user.createTime),
  updateTime: formatApiDateTime(user.updateTime)
})
