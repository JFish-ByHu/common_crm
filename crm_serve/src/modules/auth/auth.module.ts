import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { AuthController } from './auth.controller'
import { AuthResultPresenter } from './auth-result.presenter'
import { AuthService, AuthTokenService } from './services'
import { AuthSessionRepository, AuthUserRepository } from './repositories'
import { AccessTokenGuard } from './guards'
import { PresenceModule } from '../presence'

/** 认证模块，负责登录、鉴权和登录会话，并调用在线状态模块。 */
@Module({
  imports: [
    PresenceModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: Number(configService.get<string>('JWT_EXPIRES_IN_SECONDS') ?? 604800)
        }
      })
    })
  ],
  controllers: [AuthController],
  providers: [
    AuthUserRepository,
    AuthSessionRepository,
    AuthTokenService,
    AuthService,
    AuthResultPresenter,
    AccessTokenGuard
  ],
  exports: [AccessTokenGuard, AuthService, AuthSessionRepository]
})
export class AuthModule {}
