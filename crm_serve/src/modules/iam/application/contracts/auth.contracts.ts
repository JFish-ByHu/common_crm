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
export interface AuthUserProfile {
  userId: string
  username: string
  email: string | null
}

/** 返回给客户端的 token 对。 */
export interface AuthTokenData {
  accessToken: string
  refreshToken: string
}

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

export interface LoginCommand {
  username: string
  password: string
}

export interface RefreshTokenCommand {
  refreshToken: string
}

export interface LogoutCommand {
  refreshToken: string
}

export interface ChangePasswordCommand {
  currentPassword: string
  newPassword: string
}
