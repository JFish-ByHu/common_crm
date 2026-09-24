import { Module } from '@nestjs/common'
import { AuthModule } from '../auth'
import { PresenceModule } from '../presence'
import { RolesModule } from '../roles'
import { AuthorizationModule } from '../authorization'
import { UsersController } from './users.controller'
import { UsersResultPresenter } from './users-result.presenter'
import { UsersRepository } from './repositories'
import { UsersService } from './services'

/** 平台用户管理，复用认证模块的鉴权、会话以及在线状态模块的能力。 */
@Module({
  imports: [AuthModule, PresenceModule, RolesModule, AuthorizationModule],
  controllers: [UsersController],
  providers: [UsersRepository, UsersService, UsersResultPresenter],
  exports: [UsersService]
})
export class UsersModule {}
