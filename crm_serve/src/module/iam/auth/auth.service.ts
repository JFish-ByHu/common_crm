import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { compare } from 'bcryptjs'
import { PrismaService } from '../../../prisma/prisma.service'
import { Result } from '../../../common/result'
import { StatusCode } from '../../../common/status-code'
import { LoginDto } from './dto/login.dto'

export interface LoginTokenData {
  accessToken: string
  refreshToken: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async login(loginDto: LoginDto): Promise<Result<LoginTokenData>> {
    const username = loginDto.username?.trim()
    const password = loginDto.password

    if (!username || !password) {
      return Result.failure(StatusCode.BAD_REQUEST)
    }

    const user = await this.prismaService.crmUser.findUnique({
      where: { username },
      select: {
        userId: true,
        username: true,
        password: true,
        accountStatus: true
      }
    })

    if (!user || user.accountStatus !== 1 || !(await compare(password, user.password))) {
      return Result.failure(StatusCode.UNAUTHORIZED)
    }

    const payload = {
      sub: user.userId,
      username: user.username
    }
    const refreshExpiresIn = Number(
      this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN_SECONDS')
    )

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn
      })
    ])

    return Result.success({ accessToken, refreshToken })
  }
}
