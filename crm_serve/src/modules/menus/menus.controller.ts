import { Body, Controller, Delete, Get, HttpCode, Patch, Post, Query, Req } from '@nestjs/common'
import { Result } from '../../common'
import {
  ActionIdDto,
  DeleteMenusDto,
  MenuActionDto,
  MenuIdDto,
  MenuInputDto,
  UpdateMenuActionDto,
  UpdateMenuDto
} from './dto'
import { MenusService } from './services'

type ActorRequest = { user: { userId: string } }

@Controller('menus')
export class MenusController {
  constructor(private readonly menus: MenusService) {}

  /** GET /api/menus/list：完整目录树，包含停用项和按钮接口映射，用于管理及授权。 */
  @Get('list')
  async findList() {
    return Result.success(await this.menus.findTree())
  }

  /** GET /api/menus/tree：菜单树，返回字段与 list 一致。 */
  @Get('tree')
  async findTree() {
    return Result.success(await this.menus.findTree())
  }

  /** POST /api/menus/create：创建目录或页面；校验父子关系及唯一权限标识。 */
  @Post('create')
  @HttpCode(200)
  async create(@Body() input: MenuInputDto, @Req() request: ActorRequest) {
    return Result.success(await this.menus.saveMenu(input, request.user.userId))
  }

  /** PATCH /api/menus/update：完整替换菜单配置，禁止循环层级；授权关系保持稳定。 */
  @Patch('update')
  async update(@Body() input: UpdateMenuDto, @Req() request: ActorRequest) {
    const { menuId, ...data } = input
    return Result.success(await this.menus.saveMenu(data, request.user.userId, menuId))
  }

  /** DELETE /api/menus/delete：删除无子项菜单及角色关联，有菜单或按钮子项时拒绝。 */
  @Delete('delete')
  async delete(@Body() input: MenuIdDto, @Req() request: ActorRequest) {
    return Result.success(await this.menus.deleteMenus([input.menuId], request.user.userId))
  }

  /** DELETE /api/menus/batchDelete：事务内删除一组无子项菜单，失败整体回滚。 */
  @Delete('batchDelete')
  async batchDelete(@Body() input: DeleteMenusDto, @Req() request: ActorRequest) {
    return Result.success(await this.menus.deleteMenus(input.menuIds, request.user.userId))
  }

  /** GET /api/menus/endpoints：可授权的真实业务接口清单，不包含公共及会话基础接口。 */
  @Get('endpoints')
  findEndpoints() {
    return Result.success(this.menus.findEndpoints())
  }

  /** GET /api/menus/actions/list：获取一个页面的按钮及接口绑定。 */
  @Get('actions/list')
  async findActions(@Query() input: MenuIdDto) {
    return Result.success(await this.menus.findActions(input.menuId))
  }

  /** POST /api/menus/actions/create：创建按钮权限并原子绑定一个或多个实际接口。 */
  @Post('actions/create')
  @HttpCode(200)
  async createAction(@Body() input: MenuActionDto, @Req() request: ActorRequest) {
    return Result.success(await this.menus.saveAction(input, request.user.userId))
  }

  /** PATCH /api/menus/actions/update：完整替换按钮与接口映射，权限改名不改变已有授权。 */
  @Patch('actions/update')
  async updateAction(@Body() input: UpdateMenuActionDto, @Req() request: ActorRequest) {
    const { actionId, ...data } = input
    return Result.success(await this.menus.saveAction(data, request.user.userId, actionId))
  }

  /** DELETE /api/menus/actions/delete：删除按钮并同步清理接口规则和角色关联。 */
  @Delete('actions/delete')
  async deleteAction(@Body() input: ActionIdDto, @Req() request: ActorRequest) {
    return Result.success(await this.menus.deleteAction(input.actionId, request.user.userId))
  }
}
