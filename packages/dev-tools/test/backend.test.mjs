import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { test } from 'node:test'
import { isBackendConnectionError, waitForBackend } from '../src/backend-readiness.ts'
import { crmDevBackend } from '../src/backend-plugin.ts'

test('readiness waits through connection refusal and validates the service identity', async context => {
  let calls = 0
  context.mock.method(globalThis, 'fetch', async () => {
    calls++
    if (calls === 1) throw new TypeError('fetch failed')
    return new Response(
      JSON.stringify({
        code: 200,
        data: { service: calls === 2 ? 'another-service' : 'common-crm-serve', status: 'ready' }
      })
    )
  })
  await waitForBackend('http://127.0.0.1:3000', 1000, 1)
  assert.equal(calls, 3)
})

test('readiness fails clearly at its deadline instead of waiting indefinitely', async context => {
  context.mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('fetch failed')
  })
  await assert.rejects(waitForBackend('http://127.0.0.1:3000', 20, 1), /后端在 .* 秒内未就绪/)
})

test('only transport failures are treated as backend restarts', () => {
  assert.equal(isBackendConnectionError({ code: 'ECONNREFUSED' }), true)
  assert.equal(isBackendConnectionError(new AggregateError([{ code: 'ECONNREFUSED' }])), true)
  assert.equal(isBackendConnectionError({ code: 'ENOTFOUND' }), false)
  assert.equal(isBackendConnectionError(new Error('Unexpected proxy failure')), false)
})

test('proxy responds with marked 503 and deduplicates only expected transport logs', context => {
  const plugin = crmDevBackend()
  const config = plugin.config()
  const messages = []
  const errors = []
  context.mock.method(console, 'log', message => messages.push(message))
  context.mock.method(console, 'error', message => errors.push(message))
  const proxy = new EventEmitter()
  config.server.proxy['/api'].configure(proxy)
  const response = {
    headersSent: false,
    writableEnded: false,
    writeHead: (status, headers) => {
      response.status = status
      response.headers = headers
    },
    end: body => {
      response.body = JSON.parse(body)
      response.writableEnded = true
    }
  }
  const failure = Object.assign(new Error('connect refused'), { code: 'ECONNREFUSED' })
  proxy.emit('error', failure, {}, response)
  config.customLogger.error('http proxy error: /api/users/list', { error: failure })
  config.customLogger.error('http proxy error: /api/auth/heartbeat', { error: failure })
  assert.equal(response.status, 503)
  assert.equal(response.headers['X-Crm-Dev-Backend-Unavailable'], '1')
  assert.equal(response.body.code, 503)
  assert.equal(messages.length, 1)
  assert.equal(errors.length, 0)
  config.customLogger.error('Unexpected error', { error: new Error('broken configuration') })
  assert.equal(errors.length, 1)
  proxy.emit('proxyRes')
  assert.equal(messages.length, 2)
  assert.equal(plugin.apply, 'serve')
})
