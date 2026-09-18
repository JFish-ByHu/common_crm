import type { AuthTokenPayload, IssuedTokenPair, TokenSubject } from '../contracts'

export const TOKEN_PROVIDER = Symbol('TOKEN_PROVIDER')

/** token 签发、校验和摘要端口。 */
export interface TokenProvider {
  issueTokenPair(subject: TokenSubject, sessionId?: string): Promise<IssuedTokenPair>
  verifyAccessToken(token: string): Promise<AuthTokenPayload | null>
  verifyRefreshToken(token: string): Promise<AuthTokenPayload | null>
  hashToken(token: string): string
}
