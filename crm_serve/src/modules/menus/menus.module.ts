import { Module } from '@nestjs/common'
import { AuthorizationModule } from '../authorization'
import { MenusController } from './menus.controller'
import { MenusRepository } from './repositories'
import { MenusService } from './services'

@Module({
  imports: [AuthorizationModule],
  controllers: [MenusController],
  providers: [MenusRepository, MenusService],
  exports: [MenusService]
})
export class MenusModule {}
