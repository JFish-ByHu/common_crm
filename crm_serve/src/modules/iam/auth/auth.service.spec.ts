import { describe, expect, it, jest } from '@jest/globals'
import { hash as hashPassword } from 'bcryptjs'
import { AuthService } from './auth.service'
import type { AuthSessionRepository } from './auth-session.repository'
import type { AuthTokenService } from './auth-token.service'
import type { AuthTokenPayload, IssuedTokenPair, TokenSubject, UserRecord } from './types'
import type { UserRepository } from './user.repository'

jest.mock('./auth-token.service', () => ({
  AuthTokenService: class AuthTokenService {}
}))

const USER: UserRecord = {
  userId: 'user-1',
  username: 'admin',
  passwordHash: 'stored-password-hash',
  email: 'admin@example.com',
  accountStatus: 1
}

function createUserRepository() {
  return {
    findById: jest.fn<UserRepository['findById']>(async () => USER),
    findByUsername: jest.fn<UserRepository['findByUsername']>(async () => USER),
    updatePasswordAndRevokeSessions: jest.fn<UserRepository['updatePasswordAndRevokeSessions']>(
      async () => undefined
    )
  }
}

function createSessionRepository() {
  return {
    create: jest.fn<AuthSessionRepository['create']>(async () => undefined),
    findActive: jest.fn<AuthSessionRepository['findActive']>(async () => null),
    rotate: jest.fn<AuthSessionRepository['rotate']>(async () => false),
    revokeByTokenHash: jest.fn<AuthSessionRepository['revokeByTokenHash']>(async () => undefined)
  }
}

function createTokenService() {
  return {
    issueTokenPair: jest.fn<AuthTokenService['issueTokenPair']>(
      async (
        _subject: TokenSubject,
        sessionId: string = 'session-1'
      ): Promise<IssuedTokenPair> => ({
        sessionId,
        accessToken: 'access-token',
        refreshToken: 'next-refresh-token',
        tokenHash: 'next-token-hash',
        expiresAt: new Date('2030-01-01T00:00:00.000Z')
      })
    ),
    verifyAccessToken: jest.fn<AuthTokenService['verifyAccessToken']>(async () => null),
    verifyRefreshToken: jest.fn<AuthTokenService['verifyRefreshToken']>(
      async (): Promise<AuthTokenPayload | null> => null
    ),
    hashToken: jest.fn<AuthTokenService['hashToken']>(() => 'previous-token-hash')
  }
}

function createAuthService(
  users: ReturnType<typeof createUserRepository>,
  sessions: ReturnType<typeof createSessionRepository>,
  tokens: ReturnType<typeof createTokenService>
) {
  return new AuthService(
    users as unknown as UserRepository,
    sessions as unknown as AuthSessionRepository,
    tokens as unknown as AuthTokenService
  )
}

describe('AuthService', () => {
  it('creates a refresh session with a hashed token after valid login', async () => {
    const users = createUserRepository()
    users.findByUsername.mockResolvedValue({
      ...USER,
      passwordHash: await hashPassword('current-password', 4)
    })
    const sessions = createSessionRepository()
    const tokens = createTokenService()
    const service = createAuthService(users, sessions, tokens)

    await expect(
      service.login({ username: ' admin ', password: 'current-password' })
    ).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'next-refresh-token'
    })
    expect(users.findByUsername).toHaveBeenCalledWith('admin')
    expect(sessions.create).toHaveBeenCalledWith({
      sessionId: 'session-1',
      userId: USER.userId,
      tokenHash: 'next-token-hash',
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      revokedAt: null
    })
  })

  it('rotates a refresh token once and rejects replay of the old token', async () => {
    let currentTokenHash = 'previous-token-hash'
    const users = createUserRepository()
    const sessions = createSessionRepository()
    sessions.findActive.mockImplementation(async () => ({
      sessionId: 'session-1',
      userId: USER.userId,
      tokenHash: currentTokenHash,
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      revokedAt: null
    }))
    sessions.rotate.mockImplementation(async input => {
      if (currentTokenHash !== input.previousTokenHash) return false
      currentTokenHash = input.nextTokenHash
      return true
    })
    const tokens = createTokenService()
    tokens.verifyRefreshToken.mockResolvedValue({
      sub: USER.userId,
      username: USER.username,
      type: 'refresh',
      sid: 'session-1'
    })
    const service = createAuthService(users, sessions, tokens)

    await expect(service.refresh({ refreshToken: 'old-refresh-token' })).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'next-refresh-token'
    })
    await expect(service.refresh({ refreshToken: 'old-refresh-token' })).rejects.toMatchObject({
      code: 'INVALID_REFRESH_TOKEN'
    })
    expect(sessions.rotate).toHaveBeenCalledTimes(1)
  })

  it('updates the password and revokes sessions in one repository transaction', async () => {
    const users = createUserRepository()
    users.findById.mockResolvedValue({
      ...USER,
      passwordHash: await hashPassword('current-password', 4)
    })
    const sessions = createSessionRepository()
    const tokens = createTokenService()
    const service = createAuthService(users, sessions, tokens)

    await service.changePassword(
      {
        userId: USER.userId,
        username: USER.username,
        email: USER.email,
        sessionId: 'session-1'
      },
      { currentPassword: 'current-password', newPassword: 'new-password' }
    )

    expect(users.updatePasswordAndRevokeSessions).toHaveBeenCalledWith(
      USER.userId,
      expect.stringMatching(/^\$2/),
      expect.any(Date)
    )
  })
})
