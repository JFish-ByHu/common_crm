import type { AuthenticatedUser, AuthUserProfile } from '../contracts'

/** 获取当前登录用户的公开资料。 */
export class GetCurrentUserUseCase {
  /**
   * 移除仅供鉴权使用的会话字段。
   *
   * @param user 当前登录用户
   * @returns 可返回给客户端的用户资料
   */
  execute(user: AuthenticatedUser): AuthUserProfile {
    return {
      userId: user.userId,
      username: user.username,
      email: user.email
    }
  }
}
