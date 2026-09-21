import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis, { type RedisOptions } from 'ioredis'

/** 有限等待、无离线命令队列；Redis 故障不会阻塞核心业务。 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private readonly client: Redis
  readonly keyPrefix: string
  private lastWarningAt = 0
  private readonly timeoutMs = 1500

  constructor(config: ConfigService) {
    this.keyPrefix = (
      config.get<string>('REDIS_KEY_PREFIX') ||
      `crm:${config.get<string>('NODE_ENV') || 'development'}`
    ).replace(/:+$/, '')
    const options: RedisOptions = {
      lazyConnect: true,
      enableOfflineQueue: false,
      autoResendUnfulfilledCommands: false,
      maxRetriesPerRequest: 0,
      connectTimeout: this.timeoutMs,
      commandTimeout: this.timeoutMs,
      retryStrategy: attempt => Math.min(1000 * 2 ** Math.min(attempt - 1, 5), 30000)
    }
    const url = config.get<string>('REDIS_URL')
    this.client = url
      ? new Redis(url, options)
      : new Redis({
          ...options,
          host: config.get<string>('REDIS_HOST') || '127.0.0.1',
          port: Number(config.get<string>('REDIS_PORT') || 6379),
          username: config.get<string>('REDIS_USERNAME') || undefined,
          password: config.get<string>('REDIS_PASSWORD') || undefined,
          db: Number(config.get<string>('REDIS_DB') || 0),
          ...(config.get<string>('REDIS_TLS') === 'true' ? { tls: {} } : {})
        })
    this.client.on('error', () => this.reportUnavailable())
  }

  onModuleInit(): void {
    void this.client.connect().catch(() => this.reportUnavailable())
  }

  onModuleDestroy(): void {
    this.client.disconnect()
  }

  async execute<T>(operation: (client: Redis) => Promise<T>): Promise<T | null> {
    if (this.client.status !== 'ready') return null
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      return await Promise.race([
        operation(this.client),
        new Promise<null>(resolve => {
          timer = setTimeout(() => {
            this.reportUnavailable()
            resolve(null)
          }, this.timeoutMs)
        })
      ])
    } catch {
      this.reportUnavailable()
      return null
    } finally {
      clearTimeout(timer)
    }
  }

  private reportUnavailable(): void {
    if (Date.now() - this.lastWarningAt < 60000) return
    this.lastWarningAt = Date.now()
    // 不记录连接字符串和底层异常，避免将 Redis 凭据带入日志。
    this.logger.warn('Redis unavailable; online status temporarily unknown. Retrying connection.')
  }
}
