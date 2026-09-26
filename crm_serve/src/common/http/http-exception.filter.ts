import { ArgumentsHost, Catch, HttpException, Logger } from '@nestjs/common'
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core'
import { Prisma } from '@prisma/client'
import { AuthErrors, CommonErrors, MenuErrors } from '@common-crm/errors'
import { Result } from './result'
import { BusinessError } from './business-error'

const httpErrors: Record<number, { code: number; httpStatus: number; msg: string }> = {
  400: CommonErrors.BAD_REQUEST,
  401: AuthErrors.SESSION_EXPIRED,
  403: MenuErrors.NO_PERMISSION,
  404: CommonErrors.NOT_FOUND,
  405: CommonErrors.METHOD_NOT_ALLOWED,
  408: CommonErrors.REQUEST_TIMEOUT,
  409: CommonErrors.CONFLICT,
  413: CommonErrors.PAYLOAD_TOO_LARGE,
  415: CommonErrors.UNSUPPORTED_MEDIA_TYPE,
  422: CommonErrors.VALIDATION_FAILED,
  429: CommonErrors.RATE_LIMITED,
  500: CommonErrors.INTERNAL_ERROR,
  502: CommonErrors.BAD_GATEWAY,
  503: CommonErrors.SERVICE_UNAVAILABLE
}

const DATABASE_LOG_INTERVAL_MS = 60000
const databaseUnavailableReasons = new Map([
  ['P1001', '无法连接 MySQL，请检查数据库服务和网络'],
  ['P1002', 'MySQL 连接超时，请检查数据库负载和网络'],
  ['P1008', '数据库操作超时，请检查慢查询和锁等待'],
  ['P1017', 'MySQL 关闭了连接，请检查数据库重启或连接中断'],
  ['P2024', '等待数据库连接池超时，请检查慢查询、连接占用和网络'],
  ['P2037', '数据库连接数超限，请检查服务实例数及连接池配置']
])

/** 统一业务异常、Nest 异常和未知异常；业务码与 HTTP 状态独立。 */
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
    if (exception instanceof BusinessError) {
      this.replyError(host, exception.httpStatus, exception.code, exception.message)
      return
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const definition = httpErrors[status] ?? CommonErrors.INTERNAL_ERROR
      if (status >= 500) this.logger.error(exception)
      this.replyError(host, definition.httpStatus, definition.code, definition.msg)
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
      ? CommonErrors.DATABASE_UNAVAILABLE
      : CommonErrors.INTERNAL_ERROR

    if (databaseCode && databaseReason) {
      this.reportDatabaseUnavailable(databaseCode, databaseReason)
    } else {
      // 未知异常保留完整诊断信息；响应不暴露 SQL、地址或调用堆栈。
      this.logger.error(exception)
    }
    this.replyError(host, status.httpStatus, status.code, status.msg)
  }

  private replyError(host: ArgumentsHost, httpStatus: number, code: number, msg: string): void {
    const response = host.switchToHttp().getResponse<unknown>()
    const { httpAdapter } = this.adapterHost
    if (httpAdapter.isHeadersSent(response)) {
      httpAdapter.end(response)
      return
    }
    httpAdapter.reply(response, Result.failure({ code, msg }), httpStatus)
  }

  /** 心跳、轮询等并发请求遇到相同数据库故障时，每分钟最多记录一条摘要。 */
  private reportDatabaseUnavailable(code: string, reason: string): void {
    const now = Date.now()
    const state = this.databaseLogStates.get(code)
    if (state && now - state.lastLoggedAt < DATABASE_LOG_INTERVAL_MS) {
      state.suppressedCount++
      return
    }

    const summary = state?.suppressedCount ? `；期间合并了 ${state.suppressedCount} 次同类错误` : ''
    this.logger.error(
      `数据库暂时不可用 [${code}]：${reason}。相关请求返回 HTTP 503${summary}；同类日志每 60 秒最多记录一次。`
    )
    this.databaseLogStates.set(code, { lastLoggedAt: now, suppressedCount: 0 })
  }
}
