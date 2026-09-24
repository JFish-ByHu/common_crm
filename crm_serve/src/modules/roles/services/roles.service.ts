import { Injectable } from '@nestjs/common'
import { createRoleId, formatApiDateTime } from '../../../common'
import type { CreateRoleDto, RoleQueryDto, UpdateRoleDto } from '../dto'
import { RolesError } from '../roles.error'
import { RolesRepository } from '../repositories'
import { RoleStatus, type RoleStatusValue, type RoleSearch } from '../types'

type StoredRole = Awaited<ReturnType<RolesRepository['findDetail']>>
const presentRole = ({ _count, ...role }: StoredRole) => ({
  ...role,
  memberCount: _count.users,
  createTime: formatApiDateTime(role.createTime),
  updateTime: formatApiDateTime(role.updateTime)
})
@Injectable()
export class RolesService {
  constructor(private readonly repository: RolesRepository) {}

  async findList(query: RoleQueryDto) {
    const result = await this.repository.findList(this.toSearch(query))
    return { ...result, list: result.list.map(presentRole) }
  }

  findOptions(query: RoleQueryDto) {
    return this.repository.findOptions(this.toSearch(query))
  }

  async findDetail(roleId: string) {
    return presentRole(await this.repository.findDetail(roleId))
  }

  async create(command: CreateRoleDto) {
    return presentRole(
      await this.repository.create({
        roleId: createRoleId(),
        roleName: command.roleName,
        roleCode: command.roleCode,
        roleStatus: command.roleStatus ?? RoleStatus.ACTIVE,
        remark: command.remark ?? null
      })
    )
  }

  async update(command: UpdateRoleDto) {
    if (
      command.roleName === undefined &&
      command.roleStatus === undefined &&
      command.remark === undefined
    ) {
      throw new RolesError('INVALID_INPUT')
    }
    return presentRole(
      await this.repository.update(command.roleId, {
        roleName: command.roleName,
        roleStatus: command.roleStatus,
        remark: command.remark
      })
    )
  }

  async updateStatus(roleId: string, roleStatus: RoleStatusValue) {
    return presentRole(await this.repository.update(roleId, { roleStatus }))
  }

  deleteMany(roleIds: string[]) {
    return this.repository.deleteMany(roleIds)
  }
  findUserRoles(userId: string) {
    return this.repository.findUserRoles(userId)
  }
  assignUserRoles(userId: string, roleIds: string[]) {
    return this.repository.assignUserRoles(userId, roleIds)
  }

  private toSearch(query: RoleQueryDto): RoleSearch {
    const pagination =
      query.page === undefined && query.pageSize === undefined
        ? undefined
        : { page: query.page ?? 1, pageSize: query.pageSize ?? 20 }
    if (pagination && (pagination.page - 1) * pagination.pageSize > 2147483647) {
      throw new RolesError('INVALID_INPUT')
    }
    return { keyword: query.keyword, roleStatus: query.roleStatus, pagination }
  }
}
