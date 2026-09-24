import type { ApiPermissionRule, CurrentAuthorization } from '@common-crm/types/api'

export interface AuthorizationSnapshot extends CurrentAuthorization {
  endpoints: ApiPermissionRule[]
}

// Infrastructure/session endpoints have fixed authentication semantics, not business permissions.
export const PUBLIC_ENDPOINTS = new Set([
  'GET /',
  'GET /health',
  'POST /auth/login',
  'POST /auth/refresh',
  'POST /auth/logout'
])
export const SESSION_ENDPOINTS = new Set([
  'GET /auth/me',
  'POST /auth/heartbeat',
  'PATCH /auth/password',
  'GET /authorization/current'
])
export const endpointKey = (rule: { httpMethod: string; path: string }) =>
  `${rule.httpMethod} ${rule.path}`
