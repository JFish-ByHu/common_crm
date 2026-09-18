import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { getAxiosInstance, login, request } from '@common-crm/api'
import { useAuthStore } from '../src/stores/auth.ts'
import { initApiClient } from '../src/services/api.ts'

const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')

beforeEach(() => {
  const storage = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key)
    }
  })
})

afterEach(() => {
  if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor)
  else Reflect.deleteProperty(globalThis, 'localStorage')
})

async function setup(path = '/customer?tab=active#row-2') {
  const pinia = createPinia()
  const component = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/customer', component },
      { path: '/login', component }
    ]
  })
  await router.push(path)
  const auth = useAuthStore(pinia)
  initApiClient(pinia, router)
  return { auth, router }
}

test('requests read the real auth store, and 401 clears storage before redirecting', async () => {
  const { auth, router } = await setup()
  auth.setTokens('stored-token', 'stored-refresh')
  let sentAuthorization: unknown
  getAxiosInstance().defaults.adapter = async config => {
    sentAuthorization = config.headers.get('Authorization')
    return {
      config,
      data: { code: 401, data: null, msg: 'UNAUTHORIZED' },
      status: 200,
      statusText: 'OK',
      headers: {}
    }
  }
  await assert.rejects(request({ url: '/private' }), { code: 401 })
  assert.equal(sentAuthorization, 'Bearer stored-token')
  assert.equal(auth.isAuthenticated, false)
  assert.equal(auth.accessToken, null)
  assert.equal(auth.refreshToken, null)
  assert.equal(localStorage.getItem('crm-access-token'), null)
  assert.equal(localStorage.getItem('crm-refresh-token'), null)
  assert.equal(router.currentRoute.value.path, '/login')
  assert.equal(router.currentRoute.value.query.redirect, '/customer?tab=active#row-2')
})

test('invalid credentials preserve the login return address', async () => {
  const { router } = await setup('/login?redirect=%2Fcustomer%3Ftab%3Dactive')
  const initialLocation = router.currentRoute.value.fullPath
  getAxiosInstance().defaults.adapter = async config => ({
    config,
    data: { code: 401, data: null, msg: 'UNAUTHORIZED' },
    status: 200,
    statusText: 'OK',
    headers: {}
  })
  await assert.rejects(login({ username: 'test-user', password: 'invalid' }), { code: 401 })
  assert.equal(router.currentRoute.value.fullPath, initialLocation)
})

test('successful login tokens are immediately used by subsequent requests', async () => {
  const { auth } = await setup('/login')
  getAxiosInstance().defaults.adapter = async config => ({
    config,
    data: {
      code: 200,
      data: { accessToken: 'new-token', refreshToken: 'new-refresh' },
      msg: 'SUCCESS'
    },
    status: 200,
    statusText: 'OK',
    headers: {}
  })
  const result = await login({ username: 'test-user', password: 'test-password' })
  assert.ok(result.data)
  auth.setTokens(result.data.accessToken, result.data.refreshToken)
  await request({
    url: '/private',
    adapter: async config => {
      assert.equal(config.headers.get('Authorization'), 'Bearer new-token')
      return {
        config,
        data: { code: 200, data: null, msg: 'SUCCESS' },
        status: 200,
        statusText: 'OK',
        headers: {}
      }
    }
  })
  assert.equal(localStorage.getItem('crm-access-token'), 'new-token')
})
