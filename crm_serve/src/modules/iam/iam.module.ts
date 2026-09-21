import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { AuthController } from './auth/auth.controller'
import { AuthResultPresenter } from './auth/auth-result.presenter'
import { AuthService } from './auth/auth.service'
import { AuthSessionRepository } from './auth/auth-session.repository'
import { AuthTokenService } from './auth/auth-token.service'
import { AccessTokenGuard } from './auth/guards/access-token.guard'
import { UserRepository } from './auth/user.repository'
import { PresenceModule } from './presence'

/** IAM 模块，负责认证、鉴权、登录会话和在线状态。 */
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
    UserRepository,
    AuthSessionRepository,
    AuthTokenService,
    AuthService,
    AuthResultPresenter,
    AccessTokenGuard
  ],
  exports: [AccessTokenGuard, AuthService, AuthSessionRepository, PresenceModule]
})
export class IamModule {}
