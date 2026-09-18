import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../../shared/infrastructure/database'
import {
  AccountStatus,
  UserAccount,
  type UserRepository
} from '../../../domain'

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * 按用户 ID 查询账号。
   *
   * @param userId 用户 ID
   * @returns 用户账号；不存在时返回 null
   */
  async findById(userId: string): Promise<UserAccount | null> {
    const user = await this.prismaService.crmUser.findUnique({
      where: { userId },
      select: {
        userId: true,
        username: true,
        password: true,
        email: true,
        accountStatus: true
      }
    })
    return user ? this.toDomain(user) : null
  }

  /**
   * 按用户名查询账号。
   *
   * @param username 登录用户名
   * @returns 用户账号；不存在时返回 null
   */
  async findByUsername(username: string): Promise<UserAccount | null> {
    const user = await this.prismaService.crmUser.findUnique({
      where: { username },
      select: {
        userId: true,
        username: true,
        password: true,
        email: true,
        accountStatus: true
      }
    })
    return user ? this.toDomain(user) : null
  }

  private toDomain(user: {
    userId: string
    username: string
    password: string
    email: string | null
    accountStatus: number
  }) {
    return new UserAccount({
      userId: user.userId,
      username: user.username,
      passwordHash: user.password,
      email: user.email,
      accountStatus: user.accountStatus as AccountStatus
    })
  }
}
