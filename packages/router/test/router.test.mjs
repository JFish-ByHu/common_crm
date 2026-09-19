import assert from 'node:assert/strict'
import { setImmediate } from 'node:timers/promises'
import test from 'node:test'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createMicroAppNavigation, matchesMicroAppPath } from '../src/navigation.ts'
import { createMicroAppRouter } from '../src/router.ts'

async function waitFor(check) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (check()) return
    await setImmediate()
  }
  assert.ok(check(), 'Route synchronization did not settle')
}

async function setup(t, path = '/system') {
  const host = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/dashboard', component: {} },
      { path: '/system/:pathMatch(.*)*', component: {} }
    ]
  })
  await host.push('/dashboard')
  await host.push(path)
  const navigation = createMicroAppNavigation(host, '/system')
  const child = createMicroAppRouter({
    basePath: '/system',
    navigation,
    routes: [
      { path: '/', redirect: '/users' },
      { path: '/users', component: {} },
      { path: '/roles', component: {} },
      { path: '/:pathMatch(.*)*', redirect: '/users' }
    ]
  })
  t.after(() => {
    child.dispose()
    host.options.history.destroy()
  })
  await child.router.push(navigation.getPath())
  return { host, child, navigation }
}

test('module matching respects path segment boundaries', () => {
  assert.equal(matchesMicroAppPath('/system', '/system'), true)
  assert.equal(matchesMicroAppPath('/system/users', '/system'), true)
  assert.equal(matchesMicroAppPath('/systematic', '/system'), false)
  assert.equal(matchesMicroAppPath('/customer', '/system'), false)
})

test('child default redirect replaces the module entry and preserves query/hash', async t => {
  const { host, child } = await setup(t, '/system?status=active#table')
  await waitFor(() => host.currentRoute.value.fullPath === '/system/users?status=active#table')
  assert.equal(child.router.currentRoute.value.fullPath, '/users?status=active#table')
  assert.equal(child.router.resolve('/roles').href, '/system/roles')
  host.back()
  await waitFor(() => host.currentRoute.value.path === '/dashboard')
})

test('push, replace, back and forward keep host and child in sync', async t => {
  const { host, child } = await setup(t)
  await waitFor(() => host.currentRoute.value.path === '/system/users')
  await child.router.push('/roles?status=active#table')
  await waitFor(() => host.currentRoute.value.fullPath === '/system/roles?status=active#table')
  await child.router.replace('/roles?status=disabled')
  await waitFor(() => host.currentRoute.value.fullPath === '/system/roles?status=disabled')

  host.back()
  await waitFor(() => host.currentRoute.value.path === '/system/users')
  await waitFor(() => child.router.currentRoute.value.path === '/users')
  host.forward()
  await waitFor(() => child.router.currentRoute.value.fullPath === '/roles?status=disabled')

  child.router.back()
  await waitFor(() => host.currentRoute.value.path === '/system/users')
  child.router.back()
  await waitFor(() => host.currentRoute.value.path === '/dashboard')
})

test('host changes and child fallback redirects do not add history entries', async t => {
  const { host, child } = await setup(t, '/system/users')
  await host.push('/system/roles?source=menu')
  await waitFor(() => child.router.currentRoute.value.fullPath === '/roles?source=menu')
  await host.push('/system/missing')
  await waitFor(() => host.currentRoute.value.path === '/system/users')
  assert.equal(child.router.currentRoute.value.path, '/users')
  host.back()
  await waitFor(() => host.currentRoute.value.fullPath === '/system/roles?source=menu')
})

test('inactive or disposed children cannot change the host route', async t => {
  const { host, child } = await setup(t, '/system/users')
  await host.push('/dashboard')
  await child.router.push('/roles')
  await setImmediate()
  assert.equal(host.currentRoute.value.path, '/dashboard')

  child.dispose()
  await host.push('/system/users')
  await setImmediate()
  assert.equal(child.router.currentRoute.value.path, '/roles')
  await child.router.push('/roles?late=true')
  await setImmediate()
  assert.equal(host.currentRoute.value.path, '/system/users')
})

test('reentering the module root normalizes an already active default page', async t => {
  const { host, child } = await setup(t, '/system/users')
  await host.push('/system')
  await waitFor(() => host.currentRoute.value.path === '/system/users')
  assert.equal(child.router.currentRoute.value.path, '/users')
  await host.push('/system/missing')
  await waitFor(() => host.currentRoute.value.path === '/system/users')
})
