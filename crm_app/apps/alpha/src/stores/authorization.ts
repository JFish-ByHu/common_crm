import { defineStore } from 'pinia'
import { createAuthorizationState } from '@common-crm/router'
import { queryCurrentAuthorization } from '@common-crm/api'
import { useAuthStore } from './auth'

export const useAuthorizationStore = defineStore('authorization', () =>
  createAuthorizationState(
    async () => {
      const { data } = await queryCurrentAuthorization({ showProgress: false })
      if (!data) throw new Error('权限响应为空')
      return data
    },
    () => useAuthStore().accessToken
  )
)
