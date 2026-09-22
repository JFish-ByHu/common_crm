import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { Prisma, PrismaClient } from '@prisma/client'
import { setTimeout as delay } from 'node:timers/promises'

const READ_RETRY_DELAY_MS = 300
const RETRYABLE_CONNECTION_CODES = new Set(['P1001', 'P1002', 'P1017'])

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  /**
   * 只读查询遇到短暂连接故障时，等待后重新发起一次查询。
   * 必须传入创建新查询的函数；禁止包含写入或复用已失败的事务客户端。
   */
  async readWithRetry<T>(query: () => Promise<T>): Promise<T> {
    try {
      return await query()
    } catch (error) {
      const code =
        error instanceof Prisma.PrismaClientKnownRequestError
          ? error.code
          : error instanceof Prisma.PrismaClientInitializationError
            ? error.errorCode
            : undefined
      if (!code || !RETRYABLE_CONNECTION_CODES.has(code)) throw error

      await delay(READ_RETRY_DELAY_MS)
      // Prisma 自行管理连接；不重置共享连接池，以免中断其他请求或事务。
      // 第二次仍失败时原样抛出，交给统一异常过滤器返回 503。
      return query()
    }
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
