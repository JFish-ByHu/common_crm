import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  Req,
  UseGuards
} from '@nestjs/common'
import { AccessTokenGuard } from '../auth'
import { RolesResultPresenter, RolesService } from '../roles'
import {
  CreateUserDto,
  AssignUserRolesDto,
  DeleteUsersDto,
  UpdateUserDto,
  UpdateUserStatusDto,
  UserIdDto,
  UserListQueryDto,
  UserOptionsQueryDto,
  UserOnlineStatusQueryDto
} from './dto'
import { UsersResultPresenter } from './users-result.presenter'
import { UsersService } from './services'

/** 平台用户管理 HTTP 接口，统一要求有效的 access token。 */
@Controller('users')
@UseGuards(AccessTokenGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly presenter: UsersResultPresenter,
    private readonly rolesService: RolesService,
    private readonly rolesPresenter: RolesResultPresenter
  ) {}

  /**
   * GET /api/users/list：按关键字及账号状态查询用户，可选分页。
   * @param query keyword 匹配 userId、username、email；accountStatus 单独过滤
   * @returns 公开用户列表、总数及分页信息，不返回密码
   */
  @Get('list')
  findList(@Query() query: UserListQueryDto) {
    return this.presenter.present(() => this.usersService.findList(query))
  }

  /**
   * GET /api/users/onlineStatus：批量获取当前页用户的在线状态。
   * @param query 逗号分隔、去重后最多 100 个 userIds，沿用用户列表访问权限
   * @returns 已存在用户的 userId、onlineStatus；0 离线、1 在线、null 未知
   */
  @Get('onlineStatus')
  queryOnlineStatus(@Query() query: UserOnlineStatusQueryDto) {
    return this.presenter.present(() => this.usersService.queryOnlineStatus(query.userIds))
  }

  /**
   * GET /api/users/selectList：按用户名查询下拉选项，可选分页。
   * @param query username 模糊关键字及可选 page、pageSize
   * @returns 每项仅含 userId、username、accountStatus 的列表
   */
  @Get('selectList')
  findOptions(@Query() query: UserOptionsQueryDto) {
    return this.presenter.present(() => this.usersService.findOptions(query))
  }

  /**
   * POST /api/users/create：生成 crm_user_ 前缀的用户 ID，并使用 bcrypt 摘要保存密码。
   * @param command 用户名、初始密码及可选邮箱、账号状态
   * @returns 新用户的公开资料
   */
  @Post('create')
  @HttpCode(HttpStatus.OK)
  create(@Body() command: CreateUserDto) {
    return this.presenter.present(() => this.usersService.create(command))
  }

  /**
   * PATCH /api/users/update：原子更新资料和账号状态，重设密码或停用时撤销全部会话。
   * @param command userId 必传；用户名、邮箱、新密码或 accountStatus 至少传入一项
   * @returns 编辑后的公开资料
   */
  @Patch('update')
  update(@Body() command: UpdateUserDto, @Req() request: { user: { userId: string } }) {
    return this.presenter.present(() =>
      this.usersService.update(command.userId, command, request.user.userId)
    )
  }

  /**
   * PATCH /api/users/updateAccountStatus：启用或停用账号。
   * @param command userId 和 accountStatus，状态为 1 正常、0 停用
   * @returns 修改后的公开资料；停用会原子撤销登录会话
   */
  @Patch('updateAccountStatus')
  updateStatus(@Body() command: UpdateUserStatusDto) {
    return this.presenter.present(() =>
      this.usersService.updateStatus(command.userId, command.accountStatus)
    )
  }

  /**
   * DELETE /api/users/batchDelete：按 ID 数组批量物理删除用户。
   * @param command 1 至 1000 个不重复的 userIds
   * @returns 删除数量，任一用户不存在时整批回滚
   */
  @Delete('batchDelete')
  batchDelete(@Body() command: DeleteUsersDto) {
    return this.presenter.present(() => this.usersService.deleteMany(command.userIds))
  }

  /**
   * DELETE /api/users/delete：物理删除单个用户及关联登录会话。
   * @param command 待删除用户的 userId
   * @returns deletedCount 为 1；用户不存在时返回业务码 404
   */
  @Delete('delete')
  delete(@Body() command: UserIdDto) {
    return this.presenter.present(() => this.usersService.delete(command.userId))
  }

  /**
   * POST /api/users/logout：强制指定用户退出全部登录会话。
   * @param command 待退出用户的 userId
   * @returns 撤销的会话数量；没有有效会话时也幂等成功
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() command: UserIdDto) {
    return this.presenter.present(() => this.usersService.logout(command.userId))
  }

  /**
   * GET /api/users/roles：获取已分配角色，包含停用角色。
   * @param query 待查询用户的 userId
   * @returns userId 和精简角色列表 roles
   */
  @Get('roles')
  findRoles(@Query() query: UserIdDto) {
    return this.rolesPresenter.present(() => this.rolesService.findUserRoles(query.userId))
  }

  /**
   * GET /api/users/permissions：实时查询指定用户的有效权限及角色来源。
   * @param query 待查询用户的 userId
   * @returns 已分配角色和有效菜单/按钮树；停用账号无有效菜单，管理员标记全部权限
   */
  @Get('permissions')
  findPermissions(@Query() query: UserIdDto) {
    return this.presenter.present(() => this.usersService.findPermissions(query.userId))
  }

  /**
   * PATCH /api/users/assignRoles：事务内完整替换角色，不能新增分配停用角色。
   * @param command userId 和 roleIds；空数组解除全部分配
   * @returns userId 和保存后的精简角色列表 roles
   */
  @Patch('assignRoles')
  assignRoles(@Body() command: AssignUserRolesDto) {
    return this.rolesPresenter.present(() =>
      this.rolesService.assignUserRoles(command.userId, command.roleIds)
    )
  }
}
