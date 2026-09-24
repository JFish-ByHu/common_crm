import { Module } from '@nestjs/common'
import { AuthModule } from '../auth'
import { RolesController } from './roles.controller'
import { RolesRepository } from './repositories'
import { RolesService } from './services'
import { RolesResultPresenter } from './roles-result.presenter'

@Module({
  imports: [AuthModule],
  controllers: [RolesController],
  providers: [RolesRepository, RolesService, RolesResultPresenter],
  exports: [RolesService, RolesResultPresenter]
})
export class RolesModule {}
