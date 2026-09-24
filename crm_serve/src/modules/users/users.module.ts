import { Module } from '@nestjs/common'
import { IamModule } from '../iam'
import { RolesModule } from '../roles'
import { UsersController } from './users.controller'
import { UsersResultPresenter } from './users-result.presenter'
import { UsersRepository } from './users.repository'
import { UsersService } from './users.service'

/** 平台用户管理，复用 IAM 的鉴权、会话与在线状态能力。 */
@Module({
  imports: [IamModule, RolesModule],
  controllers: [UsersController],
  providers: [UsersRepository, UsersService, UsersResultPresenter],
  exports: [UsersService]
})
export class UsersModule {}
