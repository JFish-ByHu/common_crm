import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER } from '@nestjs/core'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './database'
import {
  AuthModule,
  RolesModule,
  UsersModule,
  AuthorizationModule,
  MenusModule,
  FilesModule
} from './modules'
import { HttpExceptionFilter } from './common'
import { storageConfig } from './config'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
      load: [storageConfig]
    }),
    PrismaModule,
    AuthModule,
    RolesModule,
    UsersModule,
    AuthorizationModule,
    MenusModule,
    FilesModule
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_FILTER, useClass: HttpExceptionFilter }]
})
export class AppModule {}
