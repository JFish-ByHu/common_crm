import { describe, expect, it, jest } from '@jest/globals'
import { AuthSession, UserAccount, AccountStatus } from '../../domain'
import type { AuthSessionRepository, UserRepository } from '../../domain'
import type {
  IamUnitOfWork,
  PasswordHasher,
  TokenProvider
} from '../ports'
import { ChangePasswordUseCase } from './change-password.use-case'
import { LoginUseCase } from './login.use-case'
import { RefreshTokenUseCase } from './refresh-token.use-case'

const USER = new UserAccount({
  userId: 'user-1',
  username: 'admin',
  passwordHash: 'stored-password-hash',
  email: 'admin@example.com',
  accountStatus: AccountStatus.ACTIVE
})

function createUserRepository(): UserRepository {
  return {
    findById: jest.fn(async () => USER),
    findByUsername: jest.fn(async () => USER)
  }
}

function createSessionRepository(): AuthSessionRepository {
  return {
    create: jest.fn(async () => undefined),
    findActive: jest.fn(async () => null),
    rotate: jest.fn(async () => false),
    revokeByTokenHash: jest.fn(async () => undefined)
  }
}

function createTokenProvider(): TokenProvider {
  return {
    issueTokenPair: jest.fn<TokenProvider['issueTokenPair']>(
      async (_subject, sessionId = 'session-1') => ({
        sessionId,
        accessToken: 'access-token',
        refreshToken: 'next-refresh-token',
        tokenHash: 'next-token-hash',
        expiresAt: new Date('2030-01-01T00:00:00.000Z')
      })
    ),
    verifyAccessToken: jest.fn(async () => null),
    verifyRefreshToken: jest.fn(async () => null),
    hashToken: jest.fn(() => 'previous-token-hash')
  }
}

describe('IAM authentication use cases', () => {
  it('creates a refresh session with a hashed token after valid login', async () => {
    const users = createUserRepository()
    const sessions = createSessionRepository()
    const tokens = createTokenProvider()
    const passwords: PasswordHasher = {
      matches: jest.fn(async () => true),
      hash: jest.fn(async () => 'unused')
    }
    const useCase = new LoginUseCase(users, sessions, tokens, passwords)

    const result = await useCase.execute({ username: ' admin ', password: 'current-password' })

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'next-refresh-token'
    })
    expect(users.findByUsername).toHaveBeenCalledWith('admin')
    expect(sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          sessionId: 'session-1',
          tokenHash: 'next-token-hash'
        })
      })
    )
  })

  it('rotates a refresh token once and rejects replay of the old token', async () => {
    let currentTokenHash = 'previous-token-hash'
    const users = createUserRepository()
    const sessions = createSessionRepository()
    sessions.findActive = jest.fn(async () =>
      new AuthSession({
        sessionId: 'session-1',
        userId: USER.userId,
        tokenHash: currentTokenHash,
        expiresAt: new Date('2030-01-01T00:00:00.000Z'),
        revokedAt: null
      })
    )
    sessions.rotate = jest.fn<AuthSessionRepository['rotate']>(async (input) => {
      if (currentTokenHash !== input.previousTokenHash) return false
      currentTokenHash = input.nextTokenHash
      return true
    })
    const tokens = createTokenProvider()
    tokens.verifyRefreshToken = jest.fn<TokenProvider['verifyRefreshToken']>(async () => ({
      sub: USER.userId,
      username: USER.username,
      type: 'refresh',
      sid: 'session-1'
    }))
    const useCase = new RefreshTokenUseCase(users, sessions, tokens)

    await expect(useCase.execute({ refreshToken: 'old-refresh-token' })).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'next-refresh-token'
    })
    await expect(useCase.execute({ refreshToken: 'old-refresh-token' })).rejects.toMatchObject({
      code: 'INVALID_REFRESH_TOKEN'
    })
    expect(sessions.rotate).toHaveBeenCalledTimes(1)
  })

  it('updates the password and revokes sessions through one unit of work', async () => {
    const users = createUserRepository()
    const passwords: PasswordHasher = {
      matches: jest.fn(async () => true),
      hash: jest.fn(async () => 'next-password-hash')
    }
    const unitOfWork: IamUnitOfWork = {
      changePasswordAndRevokeSessions: jest.fn(async () => undefined)
    }
    const useCase = new ChangePasswordUseCase(users, passwords, unitOfWork)

    await useCase.execute(
      {
        userId: USER.userId,
        username: USER.username,
        email: USER.email,
        sessionId: 'session-1'
      },
      { currentPassword: 'current-password', newPassword: 'new-password' }
    )

    expect(passwords.hash).toHaveBeenCalledWith('new-password')
    expect(unitOfWork.changePasswordAndRevokeSessions).toHaveBeenCalledWith(
      USER.userId,
      'next-password-hash',
      expect.any(Date)
    )
  })
})
