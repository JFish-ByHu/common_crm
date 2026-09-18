import type { AuthSession } from '../entities'

export const AUTH_SESSION_REPOSITORY = Symbol('AUTH_SESSION_REPOSITORY')

export interface RotateAuthSessionInput {
  sessionId: string
  userId: string
  previousTokenHash: string
  nextTokenHash: string
  nextExpiresAt: Date
  rotatedAt: Date
}

/** 认证会话持久化端口。 */
export interface AuthSessionRepository {
  create(session: AuthSession): Promise<void>
  findActive(sessionId: string, userId: string, at: Date): Promise<AuthSession | null>
  rotate(input: RotateAuthSessionInput): Promise<boolean>
  revokeByTokenHash(tokenHash: string, revokedAt: Date): Promise<void>
}
