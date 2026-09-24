import { Injectable } from '@nestjs/common'
import {
  createRoleId,
  formatApiDateTime,
  parseBinaryStatus,
  resolvePagination
} from '../../../common'
import type {
  DeleteCountResponse,
  RoleListItem,
  RoleListResponse,
  RoleSelectItem,
  UserRolesResponse
} from '@common-crm/types/api'
import type { CreateRoleDto, RoleQueryDto, UpdateRoleDto } from '../dto'
import { RolesError } from '../roles.error'
import { RolesRepository } from '../repositories'
import { RoleStatus, type RoleStatusValue, type RoleSearch } from '../types'

type StoredRole = Awaited<ReturnType<RolesRepository['findDetail']>>
const presentRole = ({ _count, ...role }: StoredRole): RoleListItem => ({
  ...role,
  roleStatus: parseBinaryStatus(role.roleStatus),
  memberCount: _count.users,
  createTime: formatApiDateTime(role.createTime),
  updateTime: formatApiDateTime(role.updateTime)
})
const presentRoleOption = (
  role: Omit<RoleSelectItem, 'roleStatus'> & { roleStatus: number }
): RoleSelectItem => ({
  ...role,
  roleStatus: parseBinaryStatus(role.roleStatus)
})
@Injectable()
export class RolesService {
  constructor(private readonly repository: RolesRepository) {}

  async findList(query: RoleQueryDto): Promise<RoleListResponse> {
    const result = await this.repository.findList(this.toSearch(query))
    return { ...result, list: result.list.map(presentRole) }
  }

  async findOptions(query: RoleQueryDto): Promise<RoleListResponse<RoleSelectItem>> {
    const result = await this.repository.findOptions(this.toSearch(query))
    return { ...result, list: result.list.map(presentRoleOption) }
  }

  async findDetail(roleId: string): Promise<RoleListItem> {
    return presentRole(await this.repository.findDetail(roleId))
  }

  async create(command: CreateRoleDto): Promise<RoleListItem> {
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

  async update(command: UpdateRoleDto): Promise<RoleListItem> {
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

  async updateStatus(roleId: string, roleStatus: RoleStatusValue): Promise<RoleListItem> {
    return presentRole(await this.repository.update(roleId, { roleStatus }))
  }

  deleteMany(roleIds: string[]): Promise<DeleteCountResponse> {
    return this.repository.deleteMany(roleIds)
  }
  async findUserRoles(userId: string): Promise<UserRolesResponse> {
    const result = await this.repository.findUserRoles(userId)
    return { ...result, roles: result.roles.map(presentRoleOption) }
  }
  async assignUserRoles(userId: string, roleIds: string[]): Promise<UserRolesResponse> {
    const result = await this.repository.assignUserRoles(userId, roleIds)
    return { ...result, roles: result.roles.map(presentRoleOption) }
  }

  private toSearch(query: RoleQueryDto): RoleSearch {
    const pagination = resolvePagination(query, () => new RolesError('INVALID_INPUT'))
    return { keyword: query.keyword, roleStatus: query.roleStatus, pagination }
  }
}
