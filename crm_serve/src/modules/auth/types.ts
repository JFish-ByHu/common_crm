import type {
  CurrentUser,
  AuthTokens,
  LoginRequest,
  RefreshTokenRequest,
  LogoutRequest,
  ChangePasswordRequest
} from '@common-crm/types/api'

/** JWT 用途，防止 access token 与 refresh token 混用。 */
export type TokenType = 'access' | 'refresh'

/** 认证 token 的业务载荷。 */
export interface AuthTokenPayload {
  sub: string
  username: string
  type: TokenType
  sid: string
}

/** 认证成功后写入请求上下文的当前用户。 */
export interface AuthenticatedUser {
  userId: string
  username: string
  email: string | null
  sessionId: string
}

/** 对外返回的当前用户资料。 */
export type AuthUserProfile = CurrentUser

/** 返回给客户端的 token 对。 */
export type AuthTokenData = AuthTokens

/** 签发 token 所需的用户主体。 */
export interface TokenSubject {
  userId: string
  username: string
}

/** 包含会话持久化信息的完整 token 对。 */
export interface IssuedTokenPair extends AuthTokenData {
  sessionId: string
  tokenHash: string
  expiresAt: Date
}

export type LoginCommand = LoginRequest

export type RefreshTokenCommand = RefreshTokenRequest

export type LogoutCommand = LogoutRequest

export type ChangePasswordCommand = ChangePasswordRequest

/** 用户仓储返回的认证字段。 */
export interface UserRecord {
  userId: string
  username: string
  passwordHash: string
  email: string | null
  accountStatus: number
}

/** 会话仓储返回的认证字段。 */
export interface AuthSessionRecord {
  sessionId: string
  userId: string
  tokenHash: string
  expiresAt: Date
  revokedAt: Date | null
}

export interface RotateAuthSessionInput {
  sessionId: string
  userId: string
  previousTokenHash: string
  nextTokenHash: string
  nextExpiresAt: Date
  rotatedAt: Date
}
