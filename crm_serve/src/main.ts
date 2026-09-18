import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app'
import { Result, StatusCode } from './shared/presentation/http'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api')
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: () =>
        new UnprocessableEntityException(Result.failure(StatusCode.VALIDATION_FAILED))
    })
  )
  await app.listen(process.env.PORT ?? 3000)
}

void bootstrap()
