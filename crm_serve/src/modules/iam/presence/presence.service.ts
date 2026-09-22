import { Injectable } from '@nestjs/common'
import { RedisService } from '../../../database'
import type { OnlineStatus } from './types'

const SESSION_TTL_SECONDS = 180
const BATCH_SIZE = 100

/** 只维护短期在线记录；会话是否有效仍由 IAM 数据库查询决定。 */
@Injectable()
export class PresenceService {
  constructor(private readonly redis: RedisService) {}

  async recordSession(sessionId: string): Promise<boolean> {
    const result = await this.redis.execute(client =>
      client.set(this.sessionKey(sessionId), String(Date.now()), 'EX', SESSION_TTL_SECONDS)
    )
    return result === 'OK'
  }

  async querySessions(sessionIds: string[]): Promise<Map<string, OnlineStatus>> {
    const uniqueIds = [...new Set(sessionIds)]
    const statuses = new Map<string, OnlineStatus>(uniqueIds.map(id => [id, null]))
    for (let offset = 0; offset < uniqueIds.length; offset += BATCH_SIZE) {
      const batch = uniqueIds.slice(offset, offset + BATCH_SIZE)
      const results = await this.redis.execute(client => {
        const pipeline = client.pipeline()
        for (const id of batch) pipeline.get(this.sessionKey(id))
        return pipeline.exec()
      })
      if (!results) break
      batch.forEach((id, index) => {
        const result = results[index]
        statuses.set(id, !result || result[0] ? null : result[1] === null ? 0 : 1)
      })
    }
    return statuses
  }

  async removeSessions(sessionIds: string[]): Promise<void> {
    const uniqueIds = [...new Set(sessionIds)]
    for (let offset = 0; offset < uniqueIds.length; offset += BATCH_SIZE) {
      const batch = uniqueIds.slice(offset, offset + BATCH_SIZE)
      const results = await this.redis.execute(client => {
        const pipeline = client.pipeline()
        for (const id of batch) pipeline.del(this.sessionKey(id))
        return pipeline.exec()
      })
      // 删除失败可由 TTL 清理；数据库中的会话撤销已经生效。
      if (!results) break
    }
  }

  private sessionKey(sessionId: string): string {
    return `${this.redis.keyPrefix}:presence:session:${sessionId}`
  }
}
