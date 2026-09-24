import { Module } from '@nestjs/common'
import { IamModule } from '../iam'
import { RolesController } from './roles.controller'
import { RolesRepository } from './roles.repository'
import { RolesService } from './roles.service'
import { RolesResultPresenter } from './roles-result.presenter'

@Module({
  imports: [IamModule],
  controllers: [RolesController],
  providers: [RolesRepository, RolesService, RolesResultPresenter],
  exports: [RolesService, RolesResultPresenter]
})
export class RolesModule {}
