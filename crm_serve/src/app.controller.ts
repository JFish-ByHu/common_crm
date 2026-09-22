import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'
import { Result } from './common'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello()
  }

  @Get('health')
  getHealth() {
    return Result.success({ service: 'common-crm-serve', status: 'ready' })
  }
}
