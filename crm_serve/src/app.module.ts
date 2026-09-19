import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './database'
import { IamModule } from './modules/iam'

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
