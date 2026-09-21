import assert from 'node:assert/strict'
import { setImmediate } from 'node:timers/promises'
import { test } from 'node:test'
import axios, { type InternalAxiosRequestConfig } from 'axios'
import { ApiError, initRequest, isRequestCanceled, request } from '../src/core/request.ts'
import { sendHeartbeat } from '../src/modules/auth.ts'

const unavailableError = (config: InternalAxiosRequestConfig, marked = true, status = 503) =>
  new axios.AxiosError('Backend unavailable', 'ERR_BAD_RESPONSE', config, undefined, {
    config,
    status,
    statusText: 'Unavailable',
    headers: new axios.AxiosHeaders(marked ? { 'x-crm-dev-backend-unavailable': '1' } : {}),
    data: { code: status, data: null, msg: '后端服务暂不可用，请稍后重试' }
  })

const successfulResponse = (config: InternalAxiosRequestConfig) => ({
  config,
  status: 200,
  statusText: 'OK',
  headers: new axios.AxiosHeaders(),
  data: { code: 200, data: { recorded: true }, msg: 'SUCCESS' }
})

test('GET recovers once the development backend returns', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] })
  const client = initRequest({ baseURL: '/api' })
  let attempts = 0
  client.defaults.adapter = async config => {
    if (++attempts === 1) throw unavailableError(config)
    return successfulResponse(config)
  }
  const response = request({ url: '/users/list' })
  await setImmediate()
  assert.equal(attempts, 1)
  context.mock.timers.tick(1000)
  assert.equal((await response).code, 200)
  assert.equal(attempts, 2)
})

test('persistent outage stops after four retries and preserves the 503 message', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] })
  const client = initRequest({ baseURL: '/api' })
  let attempts = 0
  client.defaults.adapter = async config => {
    attempts++
    throw unavailableError(config)
  }
  const rejected = assert.rejects(
    request({ url: '/users/list' }),
    error =>
      error instanceof ApiError &&
      error.status === 503 &&
      error.message.includes('后端服务暂不可用')
  )
  for (const delay of [1000, 2000, 4000, 4000]) {
    await setImmediate()
    context.mock.timers.tick(delay)
  }
  await rejected
  assert.equal(attempts, 5)
})

test('writes, ordinary 503 responses and opted-out reads are never replayed', async () => {
  for (const scenario of [
    { method: 'post', marked: true },
    { method: 'patch', marked: true },
    { method: 'delete', marked: true },
    { method: 'get', marked: false },
    { method: 'get', marked: true, retryOnUnavailable: false }
  ]) {
    const client = initRequest({ baseURL: '/api' })
    let attempts = 0
    client.defaults.adapter = async config => {
      attempts++
      throw unavailableError(config, scenario.marked)
    }
    await assert.rejects(request({ url: '/users/create', ...scenario }), ApiError)
    assert.equal(attempts, 1)
  }
})

test('heartbeat explicitly opts into the same bounded retry', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] })
  const client = initRequest({ baseURL: '/api' })
  let attempts = 0
  client.defaults.adapter = async config => {
    if (++attempts === 1) throw unavailableError(config)
    return successfulResponse(config)
  }
  const response = sendHeartbeat()
  await setImmediate()
  context.mock.timers.tick(1000)
  assert.equal((await response).data?.recorded, true)
  assert.equal(attempts, 2)
})

test('navigation cancellation stops a pending retry', async () => {
  const client = initRequest({ baseURL: '/api' })
  const controller = new AbortController()
  let attempts = 0
  client.defaults.adapter = async config => {
    attempts++
    throw unavailableError(config)
  }
  const rejected = assert.rejects(
    request({ url: '/users/list', signal: controller.signal }),
    isRequestCanceled
  )
  await setImmediate()
  controller.abort()
  await rejected
  assert.equal(attempts, 1)
})

test('changing account while waiting cancels the old request', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] })
  let token = 'first-session'
  const client = initRequest({ baseURL: '/api', getAccessToken: () => token })
  let attempts = 0
  client.defaults.adapter = async config => {
    attempts++
    throw unavailableError(config)
  }
  const rejected = assert.rejects(request({ url: '/users/list' }), isRequestCanceled)
  await setImmediate()
  token = 'second-session'
  context.mock.timers.tick(1000)
  await rejected
  assert.equal(attempts, 1)
})

test('authentication failures retain the existing unauthorized callback', async () => {
  let unauthorized = 0
  const client = initRequest({
    baseURL: '/api',
    onUnauthorized: () => {
      unauthorized++
    }
  })
  let attempts = 0
  client.defaults.adapter = async config => {
    attempts++
    throw unavailableError(config, false, 401)
  }
  await assert.rejects(request({ url: '/users/list' }), ApiError)
  assert.equal(attempts, 1)
  assert.equal(unauthorized, 1)
})
