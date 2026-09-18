import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import {
  ChangePasswordUseCase,
  GetCurrentUserUseCase,
  IAM_UNIT_OF_WORK,
  LoginUseCase,
  LogoutUseCase,
  PASSWORD_HASHER,
  RefreshTokenUseCase,
  TOKEN_PROVIDER,
  ValidateAccessSessionUseCase,
  type IamUnitOfWork,
  type PasswordHasher,
  type TokenProvider
} from './application'
import {
  AUTH_SESSION_REPOSITORY,
  USER_REPOSITORY,
  type AuthSessionRepository,
  type UserRepository
} from './domain'
import {
  BcryptPasswordHasher,
  JwtTokenProvider,
  PrismaAuthSessionRepository,
  PrismaIamUnitOfWork,
  PrismaUserRepository
} from './infrastructure'
import { AccessTokenGuard, AuthController, AuthResultPresenter } from './presentation/http'

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
  controllers: [AuthController],
  providers: [
    PrismaUserRepository,
    PrismaAuthSessionRepository,
    PrismaIamUnitOfWork,
    JwtTokenProvider,
    BcryptPasswordHasher,
    { provide: USER_REPOSITORY, useExisting: PrismaUserRepository },
    { provide: AUTH_SESSION_REPOSITORY, useExisting: PrismaAuthSessionRepository },
    { provide: IAM_UNIT_OF_WORK, useExisting: PrismaIamUnitOfWork },
    { provide: TOKEN_PROVIDER, useExisting: JwtTokenProvider },
    { provide: PASSWORD_HASHER, useExisting: BcryptPasswordHasher },
    {
      provide: LoginUseCase,
      inject: [USER_REPOSITORY, AUTH_SESSION_REPOSITORY, TOKEN_PROVIDER, PASSWORD_HASHER],
      useFactory: (
        users: UserRepository,
        sessions: AuthSessionRepository,
        tokens: TokenProvider,
        passwords: PasswordHasher
      ) => new LoginUseCase(users, sessions, tokens, passwords)
    },
    {
      provide: RefreshTokenUseCase,
      inject: [USER_REPOSITORY, AUTH_SESSION_REPOSITORY, TOKEN_PROVIDER],
      useFactory: (
        users: UserRepository,
        sessions: AuthSessionRepository,
        tokens: TokenProvider
      ) => new RefreshTokenUseCase(users, sessions, tokens)
    },
    {
      provide: LogoutUseCase,
      inject: [AUTH_SESSION_REPOSITORY, TOKEN_PROVIDER],
      useFactory: (sessions: AuthSessionRepository, tokens: TokenProvider) =>
        new LogoutUseCase(sessions, tokens)
    },
    GetCurrentUserUseCase,
    {
      provide: ChangePasswordUseCase,
      inject: [USER_REPOSITORY, PASSWORD_HASHER, IAM_UNIT_OF_WORK],
      useFactory: (
        users: UserRepository,
        passwords: PasswordHasher,
        unitOfWork: IamUnitOfWork
      ) => new ChangePasswordUseCase(users, passwords, unitOfWork)
    },
    {
      provide: ValidateAccessSessionUseCase,
      inject: [USER_REPOSITORY, AUTH_SESSION_REPOSITORY, TOKEN_PROVIDER],
      useFactory: (
        users: UserRepository,
        sessions: AuthSessionRepository,
        tokens: TokenProvider
      ) => new ValidateAccessSessionUseCase(users, sessions, tokens)
    },
    AuthResultPresenter,
    AccessTokenGuard
  ],
  exports: [AccessTokenGuard]
})
export class IamModule {}
