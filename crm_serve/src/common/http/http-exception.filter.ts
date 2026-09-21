import { ArgumentsHost, Catch, HttpException, Logger } from '@nestjs/common'
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core'
import { Prisma } from '@prisma/client'
import { Result } from './result'
import { StatusCode } from './status-code'

const databaseUnavailableCodes = new Set([
  'P1001', // 无法连接数据库。
  'P1002', // 数据库连接超时。
  'P1008', // 数据库操作超时。
  'P1017', // 数据库关闭连接。
  'P2024', // 等待连接池超时。
  'P2037' // 数据库连接数超限。
])

/** 统一未处理的服务端异常；已有 HttpException 响应保持原有状态码和结构。 */
@Catch()
export class HttpExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  constructor(private readonly adapterHost: HttpAdapterHost) {
    super(adapterHost.httpAdapter)
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    if (exception instanceof HttpException) {
      super.catch(exception, host)
      return
    }

    const databaseCode =
      exception instanceof Prisma.PrismaClientKnownRequestError
        ? exception.code
        : exception instanceof Prisma.PrismaClientInitializationError
          ? exception.errorCode
          : undefined
    const databaseUnavailable =
      databaseCode !== undefined && databaseUnavailableCodes.has(databaseCode)
    const status = databaseUnavailable
      ? StatusCode.SERVICE_UNAVAILABLE
      : StatusCode.INTERNAL_SERVER_ERROR
    const message = databaseUnavailable
      ? '数据库暂时不可用，请稍后重试'
      : '服务器内部错误，请稍后重试'

    // 保留服务端诊断信息，但不把 SQL、地址、异常消息或堆栈放进响应。
    this.logger.error(exception)
    const response = host.switchToHttp().getResponse<unknown>()
    const { httpAdapter } = this.adapterHost
    if (httpAdapter.isHeadersSent(response)) {
      httpAdapter.end(response)
      return
    }
    httpAdapter.reply(response, Result.failure(status, null, message), status.code)
  }
}
