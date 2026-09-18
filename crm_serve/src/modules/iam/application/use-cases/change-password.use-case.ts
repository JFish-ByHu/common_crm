import type { UserRepository } from '../../domain'
import type { AuthenticatedUser, ChangePasswordCommand } from '../contracts'
import { AuthApplicationError } from '../errors'
import type { IamUnitOfWork, PasswordHasher } from '../ports'

/** 修改密码并撤销用户的全部认证会话。 */
export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly unitOfWork: IamUnitOfWork
  ) {}

  /**
   * 校验当前密码并原子更新密码、撤销会话。
   *
   * @param user 当前登录用户
   * @param command 当前密码和新密码
   * @returns 操作完成后返回 void
   * @throws AuthApplicationError 密码未变化、凭据错误或账号不可用
   */
  async execute(user: AuthenticatedUser, command: ChangePasswordCommand): Promise<void> {
    if (command.currentPassword === command.newPassword) {
      throw new AuthApplicationError('PASSWORD_UNCHANGED')
    }

    const storedUser = await this.userRepository.findById(user.userId)
    if (!storedUser || !storedUser.isActive()) {
      throw new AuthApplicationError('ACCOUNT_UNAVAILABLE')
    }

    const passwordMatches = await this.passwordHasher.matches(
      command.currentPassword,
      storedUser.passwordHash
    )
    if (!passwordMatches) throw new AuthApplicationError('INVALID_CREDENTIALS')

    const passwordHash = await this.passwordHasher.hash(command.newPassword)
    await this.unitOfWork.changePasswordAndRevokeSessions(user.userId, passwordHash, new Date())
  }
}
