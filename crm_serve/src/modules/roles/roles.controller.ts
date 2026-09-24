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
import { MenusService } from '../menus'
import { Result } from '../../common'
import {
  CreateRoleDto,
  AssignRolePermissionsDto,
  DeleteRolesDto,
  RoleIdDto,
  RoleQueryDto,
  UpdateRoleDto,
  UpdateRoleStatusDto
} from './dto'
import { RolesResultPresenter } from './roles-result.presenter'
import { RolesService } from './services'

@Controller('roles')
@UseGuards(AccessTokenGuard)
export class RolesController {
  constructor(
    private readonly service: RolesService,
    private readonly presenter: RolesResultPresenter,
    private readonly menus: MenusService
  ) {}

  /** GET /api/roles/permissions：读取角色授权及版本号，系统管理角色为全部权限。 */
  @Get('permissions')
  async findPermissions(@Query() query: RoleIdDto) {
    return Result.success(await this.menus.findRolePermissions(query.roleId))
  }

  /** GET /api/roles/permissionTree：供角色授权选择目录、页面及按钮。 */
  @Get('permissionTree')
  async findPermissionTree() {
    return Result.success(await this.menus.findTree())
  }

  /** PATCH /api/roles/updatePermissions：完整替换菜单、按钮授权；空数组清空，自动包含祖先目录。 */
  @Patch('updatePermissions')
  async updatePermissions(
    @Body() input: AssignRolePermissionsDto,
    @Req() request: { user: { userId: string } }
  ) {
    return Result.success(await this.menus.assignPermissions(input, request.user.userId))
  }

  /**
   * GET /api/roles/list：按 ID、名称或编码检索，可按状态过滤，不传分页参数查询全部。
   * @param query 关键字、角色状态及可选分页参数
   * @returns 角色列表、成员数量、总数及分页信息，时间已格式化
   */
  @Get('list')
  findList(@Query() query: RoleQueryDto) {
    return this.presenter.present(() => this.service.findList(query))
  }

  /**
   * GET /api/roles/selectList：角色下拉选项，可选分页。
   * @param query 与角色列表相同的查询条件
   * @returns 列表项仅包含 roleId、roleName、roleCode、roleStatus
   */
  @Get('selectList')
  findOptions(@Query() query: RoleQueryDto) {
    return this.presenter.present(() => this.service.findOptions(query))
  }

  /**
   * GET /api/roles/detail：获取角色资料及成员数量。
   * @param query 待查询角色的 roleId
   * @returns 完整角色资料，不存在时返回业务码 404
   */
  @Get('detail')
  findDetail(@Query() query: RoleIdDto) {
    return this.presenter.present(() => this.service.findDetail(query.roleId))
  }

  /**
   * POST /api/roles/create：生成 crm_role_ 前缀 ID，角色编码必须唯一。
   * @param command 名称、编码及可选的状态和备注
   * @returns 新角色资料
   */
  @Post('create')
  @HttpCode(HttpStatus.OK)
  create(@Body() command: CreateRoleDto) {
    return this.presenter.present(() => this.service.create(command))
  }

  /**
   * PATCH /api/roles/update：修改名称、状态或备注，ID 和编码不可修改。
   * @param command roleId，以及至少一个可编辑字段
   * @returns 更新后的角色资料
   */
  @Patch('update')
  update(@Body() command: UpdateRoleDto) {
    return this.presenter.present(() => this.service.update(command))
  }

  /**
   * PATCH /api/roles/updateRoleStatus：启停角色，保留已有用户关联。
   * @param command roleId 和 roleStatus（1 启用、0 停用）
   * @returns 更新后的角色资料
   */
  @Patch('updateRoleStatus')
  updateStatus(@Body() command: UpdateRoleStatusDto) {
    return this.presenter.present(() =>
      this.service.updateStatus(command.roleId, command.roleStatus)
    )
  }

  /**
   * DELETE /api/roles/delete：删除未分配的角色；存在成员时返回业务码 409。
   * @param command 待删除角色的 roleId
   * @returns deletedCount 为 1
   */
  @Delete('delete')
  delete(@Body() command: RoleIdDto) {
    return this.presenter.present(() => this.service.deleteMany([command.roleId]))
  }

  /**
   * DELETE /api/roles/batchDelete：删除角色，任一不存在或仍有成员则整批回滚。
   * @param command 1 至 1000 个不重复的 roleIds
   * @returns 实际删除数量 deletedCount
   */
  @Delete('batchDelete')
  batchDelete(@Body() command: DeleteRolesDto) {
    return this.presenter.present(() => this.service.deleteMany(command.roleIds))
  }
}
