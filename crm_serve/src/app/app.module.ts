import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { IamModule } from '../modules/iam'
import { PrismaModule } from '../shared/infrastructure/database'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env']
    }),
    PrismaModule,
    IamModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
