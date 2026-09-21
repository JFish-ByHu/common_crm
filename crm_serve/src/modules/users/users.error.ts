export type UsersErrorCode = 'INVALID_INPUT' | 'USER_NOT_FOUND' | 'USER_CONFLICT'

export class UsersError extends Error {
  constructor(public readonly code: UsersErrorCode) {
    super(code)
    this.name = 'UsersError'
  }
}
