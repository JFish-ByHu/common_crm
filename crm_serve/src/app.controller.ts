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

  /** GET /api/health：供开发代理判断后端是否完成启动，不返回配置或凭据。 */
  @Get('health')
  getHealth() {
    return Result.success({ service: 'common-crm-serve', status: 'ready' })
  }
}
