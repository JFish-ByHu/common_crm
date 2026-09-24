import { computed, shallowRef } from 'vue'
import type { AuthorizedMenu, CurrentAuthorization } from '@common-crm/types/api'

export const flattenAuthorizedMenus = (menus: AuthorizedMenu[]): AuthorizedMenu[] =>
  menus.flatMap(menu => [menu, ...flattenAuthorizedMenus(menu.children)])

const AUTHORIZATION_CACHE_MS = 60_000

/** Session-scoped memory cache; hosted applications obtain snapshots from Alpha. */
export const createAuthorizationState = (
  load: (force: boolean) => Promise<CurrentAuthorization>,
  getSession: () => string | null
) => {
  const state = shallowRef<CurrentAuthorization | null>(null)
  let session: string | null = null
  let pending: Promise<void> | undefined
  let loadedAt = 0
  let generation = 0
  const pages = computed(() =>
    flattenAuthorizedMenus(state.value?.menus ?? []).filter(menu => menu.menuType === 'PAGE')
  )
  const clear = () => {
    state.value = null
    session = null
    pending = undefined
    loadedAt = 0
    generation++
  }
  const loadAuthorization = (force: boolean, useCache: boolean): Promise<void> => {
    const token = getSession()
    if (!token) {
      clear()
      return Promise.resolve()
    }
    if (session !== token) {
      clear()
      session = token
    }
    if (pending) {
      if (!force) return pending
      // A mutation must not reuse a request that began before it was committed.
      return pending
        .catch(() => undefined)
        .then(() => {
          if (getSession() === token) return loadAuthorization(true, false)
        })
    }
    if (useCache && state.value && Date.now() - loadedAt < AUTHORIZATION_CACHE_MS) {
      return Promise.resolve()
    }
    const requestGeneration = generation
    const operation = load(force)
      .then(result => {
        if (generation === requestGeneration && session === token && getSession() === token) {
          state.value = result
          loadedAt = Date.now()
        }
      })
      .catch(error => {
        if (generation === requestGeneration && session === token) {
          state.value = null
          loadedAt = 0
        }
        throw error
      })
      .finally(() => {
        if (pending === operation) pending = undefined
      })
    pending = operation
    return operation
  }
  const ensure = () => loadAuthorization(false, true)
  // force=false synchronizes the local view with the host's cached snapshot.
  const refresh = (force = true) => loadAuthorization(force, false)
  const hasPermission = (code: string): boolean =>
    getSession() === session &&
    !!state.value &&
    (state.value.isSuperAdmin || state.value.permissions.includes(code))
  const canVisit = (path: string): boolean =>
    getSession() === session && pages.value.some(page => page.routePath === path)
  return { state, pages, ensure, refresh, clear, hasPermission, canVisit }
}
