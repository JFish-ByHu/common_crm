import { readdir, readFile } from 'node:fs/promises'
import { basename, relative, resolve } from 'node:path'
import MagicString from 'magic-string'
import { normalizePath, type Plugin } from 'vite'
import type { PageCatalogEntry } from '@common-crm/types/page'
import { parsePage } from './page-parser.ts'

const catalogId = 'virtual:crm-pages/catalog'
const componentsId = 'virtual:crm-pages/components'
const ignoredDirectories = new Set([
  'node_modules',
  'dist',
  'components',
  'hooks',
  'tests',
  '__tests__'
])
type DiscoveredPage = PageCatalogEntry & { absoluteFile: string }

const scanVueFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true }).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return []
      throw error
    }
  )
  const files = await Promise.all(
    entries.map(entry => {
      const file = resolve(directory, entry.name)
      if (entry.isDirectory() && !ignoredDirectories.has(entry.name)) return scanVueFiles(file)
      return entry.isFile() && entry.name.endsWith('.vue') ? [file] : []
    })
  )
  return files.flat().sort()
}

/** 扫描各子应用的显式页面声明；元信息可跨应用共享，组件代码仅由所属应用加载。 */
export const crmPages = (): Plugin => {
  let appRoot = ''
  let appsRoot = ''
  let pages: DiscoveredPage[] = []
  let fingerprint = ''
  let servedFingerprint = ''
  let scanFailed = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending = Promise.resolve()

  const scanPages = async () => {
    const apps = (await readdir(appsRoot, { withFileTypes: true }))
      .filter(
        entry =>
          entry.isDirectory() && !entry.name.startsWith('.') && !ignoredDirectories.has(entry.name)
      )
      .sort((a, b) => a.name.localeCompare(b.name))
    const discovered: DiscoveredPage[] = []
    for (const app of apps) {
      const root = resolve(appsRoot, app.name)
      for (const file of await scanVueFiles(resolve(root, 'src/views'))) {
        const parsed = parsePage(await readFile(file, 'utf8'), file)
        if (!parsed) continue
        const { definition } = parsed
        const basePath = `/${app.name}`
        if (
          !definition.key.startsWith(`${app.name}-`) ||
          !(
            definition.defaultPath === basePath || definition.defaultPath.startsWith(basePath + '/')
          )
        ) {
          throw new Error(`[definePage] ${file}: key 和 defaultPath 必须属于 ${app.name} 应用`)
        }
        if (
          definition.defaultPath.split('/').includes('access-denied') ||
          definition.defaultPath === '/system'
        ) {
          throw new Error(`[definePage] ${file}: 不能占用保留路由`)
        }
        discovered.push({
          ...definition,
          visible: definition.visible ?? true,
          app: app.name,
          basePath,
          file: normalizePath(relative(root, file)),
          absoluteFile: normalizePath(file)
        })
      }
    }
    const keys = new Set<string>()
    const paths = new Set<string>()
    for (const page of discovered) {
      const path = page.defaultPath.replace(/:[a-zA-Z][a-zA-Z0-9_]*/g, ':param')
      if (keys.has(page.key) || paths.has(path)) {
        throw new Error(
          `[definePage] ${page.file}: 重复组件 key 或冲突的默认路由 ${page.key} / ${page.defaultPath}`
        )
      }
      keys.add(page.key)
      paths.add(path)
    }
    const next = JSON.stringify(discovered)
    pages = discovered
    fingerprint = next
  }

  return {
    name: 'crm-define-page',
    enforce: 'pre',
    configResolved: config => {
      appRoot = normalizePath(resolve(config.root))
      appsRoot = resolve(appRoot, '..')
    },
    buildStart: async () => {
      await scanPages()
      servedFingerprint = fingerprint
    },
    resolveId: id => (id === catalogId || id === componentsId ? '\0' + id : undefined),
    load: async function (id) {
      if (id !== '\0' + catalogId && id !== '\0' + componentsId) return
      await scanPages()
      for (const page of pages) this.addWatchFile(page.absoluteFile)
      if (id === '\0' + catalogId) {
        return `export const pageCatalog = ${JSON.stringify(
          pages.map(page => ({
            key: page.key,
            title: page.title,
            defaultPath: page.defaultPath,
            visible: page.visible,
            app: page.app,
            basePath: page.basePath,
            file: page.file
          }))
        )}`
      }
      const local = pages.filter(page => page.app === basename(appRoot))
      return `export const pageComponents = {${local
        .map(
          page =>
            `${JSON.stringify(page.key)}: () => import(${JSON.stringify('/src/' + page.file.slice(4))})`
        )
        .join(',')}}`
    },
    transform: async (code, id) => {
      if (!id.endsWith('.vue')) return
      const parsed = parsePage(code, id)
      if (!parsed) return
      const file = normalizePath(id)
      // 新文件或新增声明的 transform 可能早于 watcher 的合并刷新。
      if (!pages.some(page => page.absoluteFile === file)) await scanPages()
      if (!pages.some(page => page.absoluteFile === file)) {
        throw new Error(
          `[definePage] ${id}: 页面必须位于 src/views 内，不能放入 components 等内部目录`
        )
      }
      const source = new MagicString(code)
      source.remove(parsed.start, parsed.end)
      return {
        code: source.toString(),
        map: source.generateMap({ hires: true, source: id, includeContent: true })
      }
    },
    configureServer: server => {
      server.watcher.add(appsRoot)
      const refreshPages = (file: string) => {
        if (
          !file.endsWith('.vue') ||
          !normalizePath(file).startsWith(normalizePath(appsRoot) + '/')
        )
          return
        clearTimeout(timer)
        timer = setTimeout(() => {
          pending = pending
            .then(async () => {
              await scanPages()
              if (servedFingerprint === fingerprint && !scanFailed) return
              scanFailed = false
              servedFingerprint = fingerprint
              for (const id of [catalogId, componentsId]) {
                const module = server.moduleGraph.getModuleById('\0' + id)
                if (module) server.moduleGraph.invalidateModule(module)
              }
              server.ws.send({ type: 'full-reload' })
            })
            .catch((error: Error) => {
              scanFailed = true
              server.config.logger.error(error.message)
              server.ws.send({
                type: 'error',
                err: { message: error.message, stack: error.stack ?? '', plugin: 'crm-define-page' }
              })
            })
        }, 100)
      }
      server.watcher.on('add', refreshPages).on('unlink', refreshPages).on('change', refreshPages)
      server.httpServer?.once('close', () => {
        clearTimeout(timer)
        server.watcher
          .off('add', refreshPages)
          .off('unlink', refreshPages)
          .off('change', refreshPages)
      })
    }
  }
}
