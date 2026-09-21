import { describe, expect, it, jest } from '@jest/globals'
import type Redis from 'ioredis'
import type { RedisService } from '../../../redis'
import { PresenceService } from './presence.service'

jest.mock('../../../redis', () => ({
  RedisService: class RedisService {}
}))

const createFixture = () => {
  const pipeline = {
    get: jest.fn(),
    del: jest.fn(),
    exec: jest.fn<() => Promise<[Error | null, unknown][] | null>>()
  }
  const client = {
    set: jest.fn<(key: string, value: string, mode: string, ttl: number) => Promise<string>>(
      async () => 'OK'
    ),
    pipeline: () => pipeline
  }
  const redis = {
    keyPrefix: 'crm:test',
    execute: jest.fn<(operation: (client: Redis) => Promise<unknown>) => Promise<unknown>>(
      async operation => operation(client as unknown as Redis)
    )
  }
  return { client, pipeline, redis, service: new PresenceService(redis as unknown as RedisService) }
}

describe('PresenceService', () => {
  it('records and renews a session with one atomic SET and a 180-second TTL', async () => {
    const { client, redis, service } = createFixture()
    await expect(service.recordSession('session-1')).resolves.toBe(true)
    expect(client.set).toHaveBeenCalledWith(
      'crm:test:presence:session:session-1',
      expect.stringMatching(/^\d{13}$/),
      'EX',
      180
    )
    redis.execute.mockResolvedValueOnce(null)
    await expect(service.recordSession('session-1')).resolves.toBe(false)
  })

  it('distinguishes existing, expired and unreadable session keys', async () => {
    const { pipeline, service } = createFixture()
    pipeline.exec.mockResolvedValueOnce([
      [null, '1790000000000'],
      [null, null],
      [new Error('Redis command failed'), null]
    ])
    const statuses = await service.querySessions(['active', 'expired', 'failed', 'active'])
    expect([...statuses]).toEqual([
      ['active', 1],
      ['expired', 0],
      ['failed', null]
    ])
    expect(pipeline.get).toHaveBeenCalledTimes(3)
  })

  it('returns unknown on an outage without repeatedly waiting for remaining batches', async () => {
    const { redis, service } = createFixture()
    redis.execute.mockResolvedValue(null)
    const ids = Array.from({ length: 201 }, (_, index) => `session-${index}`)
    const statuses = await service.querySessions(ids)
    expect([...statuses.values()]).toEqual(ids.map(() => null))
    expect(redis.execute).toHaveBeenCalledTimes(1)
    await expect(service.removeSessions(ids)).resolves.toBeUndefined()
  })
})
