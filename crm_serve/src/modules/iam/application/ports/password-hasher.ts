export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER')

/** 密码摘要与校验端口。 */
export interface PasswordHasher {
  matches(plainText: string, passwordHash: string): Promise<boolean>
  hash(plainText: string): Promise<string>
}
