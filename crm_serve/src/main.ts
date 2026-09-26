import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { CommonErrors } from '@common-crm/errors'
import { BusinessError } from './common/http'

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api')
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: () => new BusinessError(CommonErrors.VALIDATION_FAILED)
    })
  )
  await app.listen(process.env.PORT ?? 3000)
}

void bootstrap()
