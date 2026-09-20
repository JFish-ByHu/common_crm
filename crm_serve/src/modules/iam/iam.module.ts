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
import { UsersController, UsersRepository, UsersResultPresenter, UsersService } from './users'

/** IAM 模块，集中装配认证和平台用户管理。 */
@Module({
  imports: [
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
  controllers: [AuthController, UsersController],
  providers: [
    UserRepository,
    AuthSessionRepository,
    AuthTokenService,
    AuthService,
    AuthResultPresenter,
    AccessTokenGuard,
    UsersRepository,
    UsersService,
    UsersResultPresenter
  ],
  exports: [AccessTokenGuard]
})
export class IamModule {}
