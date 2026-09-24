import { createAuthorizationState } from '@common-crm/router'
import { queryCurrentAuthorization } from '@common-crm/api'
import { getMicroAppProps } from '../micro-app'

export const authorization = createAuthorizationState(
  async force => {
    const sharedLoader = getMicroAppProps().getAuthorization
    if (sharedLoader) return sharedLoader(force)
    const { data } = await queryCurrentAuthorization({ showProgress: false })
    if (!data) throw new Error('权限响应为空')
    return data
  },
  () => getMicroAppProps().getAuthState?.().accessToken ?? localStorage.getItem('crm-access-token')
)

export const ensureAuthorization = () =>
  getMicroAppProps().getAuthorization ? authorization.refresh(false) : authorization.ensure()

export const refreshAuthorization = () => authorization.refresh()
