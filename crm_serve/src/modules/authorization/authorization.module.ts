import { Module } from '@nestjs/common'
import { APP_GUARD, DiscoveryModule } from '@nestjs/core'
import { RedisModule } from '../../database'
import { AuthModule } from '../auth'
import { AuthorizationController } from './authorization.controller'
import { PermissionGuard } from './guards'
import { AuthorizationRepository } from './repositories'
import { AuthorizationService, EndpointCatalogService } from './services'

@Module({
  imports: [AuthModule, RedisModule, DiscoveryModule],
  controllers: [AuthorizationController],
  providers: [
    AuthorizationRepository,
    AuthorizationService,
    EndpointCatalogService,
    { provide: APP_GUARD, useClass: PermissionGuard }
  ],
  exports: [AuthorizationService, EndpointCatalogService]
})
export class AuthorizationModule {}
