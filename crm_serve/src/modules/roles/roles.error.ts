export type RolesErrorCode =
  | 'INVALID_INPUT'
  | 'ROLE_NOT_FOUND'
  | 'ROLE_CONFLICT'
  | 'ROLE_IN_USE'
  | 'ROLE_DISABLED'
  | 'USER_NOT_FOUND'

export class RolesError extends Error {
  constructor(readonly code: RolesErrorCode) {
    super(code)
    this.name = 'RolesError'
  }
}
