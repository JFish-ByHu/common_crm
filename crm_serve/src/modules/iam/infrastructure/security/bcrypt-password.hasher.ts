import { Injectable } from '@nestjs/common'
import { compare, hash } from 'bcryptjs'
import type { PasswordHasher } from '../../application'

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  /**
   * 校验明文密码与摘要是否匹配。
   *
   * @param plainText 明文密码
   * @param passwordHash 已存储的密码摘要
   * @returns 密码匹配时返回 true
   */
  matches(plainText: string, passwordHash: string): Promise<boolean> {
    return compare(plainText, passwordHash)
  }

  /**
   * 使用 bcrypt 生成密码摘要。
   *
   * @param plainText 明文密码
   * @returns bcrypt 密码摘要
   */
  hash(plainText: string): Promise<string> {
    return hash(plainText, 12)
  }
}
