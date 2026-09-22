import { ArgumentsHost, Catch, HttpException, Logger } from '@nestjs/common'
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core'
import { Prisma } from '@prisma/client'
import { Result } from './result'
import { StatusCode } from './status-code'

const DATABASE_LOG_INTERVAL_MS = 60000
const databaseUnavailableReasons = new Map([
  ['P1001', '无法连接 MySQL，请检查数据库服务和网络'],
  ['P1002', 'MySQL 连接超时，请检查数据库负载和网络'],
  ['P1008', '数据库操作超时，请检查慢查询和锁等待'],
  ['P1017', 'MySQL 关闭了连接，请检查数据库重启或连接中断'],
  ['P2024', '等待数据库连接池超时，请检查慢查询、连接占用和网络'],
  ['P2037', '数据库连接数超限，请检查服务实例数及连接池配置']
])

/** 统一未处理的服务端异常；已有 HttpException 响应保持原有状态码和结构。 */
@Catch()
export class HttpExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)
  private readonly databaseLogStates = new Map<
    string,
    { lastLoggedAt: number; suppressedCount: number }
  >()

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
    const databaseReason = databaseCode ? databaseUnavailableReasons.get(databaseCode) : undefined
    const databaseUnavailable = databaseReason !== undefined
    const status = databaseUnavailable
      ? StatusCode.SERVICE_UNAVAILABLE
      : StatusCode.INTERNAL_SERVER_ERROR
    const message = databaseUnavailable
      ? '数据库暂时不可用，请稍后重试'
      : '服务器内部错误，请稍后重试'

    if (databaseCode && databaseReason) {
      this.reportDatabaseUnavailable(databaseCode, databaseReason)
    } else {
      // 未知异常保留完整诊断信息；响应不暴露 SQL、地址或调用堆栈。
      this.logger.error(exception)
    }
    const response = host.switchToHttp().getResponse<unknown>()
    const { httpAdapter } = this.adapterHost
    if (httpAdapter.isHeadersSent(response)) {
      httpAdapter.end(response)
      return
    }
    httpAdapter.reply(response, Result.failure(status, null, message), status.code)
  }

  /** 心跳、轮询等并发请求遇到相同数据库故障时，每分钟最多记录一条摘要。 */
  private reportDatabaseUnavailable(code: string, reason: string): void {
    const now = Date.now()
    const state = this.databaseLogStates.get(code)
    if (state && now - state.lastLoggedAt < DATABASE_LOG_INTERVAL_MS) {
      state.suppressedCount++
      return
    }

    const summary = state?.suppressedCount
      ? `；期间合并了 ${state.suppressedCount} 次同类错误`
      : ''
    this.logger.error(
      `数据库暂时不可用 [${code}]：${reason}。相关请求返回 HTTP 503${summary}；同类日志每 60 秒最多记录一次。`
    )
    this.databaseLogStates.set(code, { lastLoggedAt: now, suppressedCount: 0 })
  }
}
