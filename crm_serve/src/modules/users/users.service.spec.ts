import { describe, expect, it, jest } from '@jest/globals'
import type { AuthSessionRepository, PresenceService } from '../iam'
import { UsersService } from './users.service'
import type { UsersRepository } from './users.repository'

jest.mock('../iam', () => ({
  AuthSessionRepository: class AuthSessionRepository {},
  PresenceService: class PresenceService {}
}))

describe('UsersService online status', () => {
  it('aggregates valid sessions; online wins over unknown and disabled accounts stay offline', async () => {
    const accounts = [
      { userId: 'online', accountStatus: 1 },
      { userId: 'offline', accountStatus: 1 },
      { userId: 'unknown', accountStatus: 1 },
      { userId: 'disabled', accountStatus: 0 },
      { userId: 'no-session', accountStatus: 1 }
    ]
    const users = { findAccountsForPresence: jest.fn(async () => accounts) }
    const sessions = {
      findActiveForUsers: jest.fn<
        (userIds: string[]) => Promise<{ userId: string; sessionId: string }[]>
      >(async () => [
        { userId: 'online', sessionId: 'online-1' },
        { userId: 'online', sessionId: 'online-2' },
        { userId: 'offline', sessionId: 'offline-1' },
        { userId: 'unknown', sessionId: 'unknown-1' }
      ])
    }
    const presence = {
      querySessions: jest.fn<PresenceService['querySessions']>(
        async () =>
          new Map([
            ['online-1', 1],
            ['online-2', null],
            ['offline-1', 0],
            ['unknown-1', null]
          ])
      )
    }
    const service = new UsersService(
      users as unknown as UsersRepository,
      sessions as unknown as AuthSessionRepository,
      presence as unknown as PresenceService
    )
    await expect(service.queryOnlineStatus(accounts.map(user => user.userId))).resolves.toEqual([
      { userId: 'online', onlineStatus: 1 },
      { userId: 'offline', onlineStatus: 0 },
      { userId: 'unknown', onlineStatus: null },
      { userId: 'disabled', onlineStatus: 0 },
      { userId: 'no-session', onlineStatus: 0 }
    ])
    expect(sessions.findActiveForUsers).toHaveBeenCalledWith([
      'online',
      'offline',
      'unknown',
      'no-session'
    ])
  })
})
