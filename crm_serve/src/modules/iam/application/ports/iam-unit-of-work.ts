export const IAM_UNIT_OF_WORK = Symbol('IAM_UNIT_OF_WORK')

/** IAM 需要原子提交的持久化操作。 */
export interface IamUnitOfWork {
  changePasswordAndRevokeSessions(
    userId: string,
    passwordHash: string,
    changedAt: Date
  ): Promise<void>
}
