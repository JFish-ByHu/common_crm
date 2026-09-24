import { Module } from '@nestjs/common'
import { AuthModule } from '../auth'
import { MenusModule } from '../menus'
import { RolesController } from './roles.controller'
import { RolesRepository } from './repositories'
import { RolesService } from './services'
import { RolesResultPresenter } from './roles-result.presenter'

@Module({
  imports: [AuthModule, MenusModule],
  controllers: [RolesController],
  providers: [RolesRepository, RolesService, RolesResultPresenter],
  exports: [RolesService, RolesResultPresenter]
})
export class RolesModule {}
