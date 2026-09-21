import { createLogger, type Plugin } from 'vite'
import { isBackendConnectionError, waitForBackend } from './backend-readiness.ts'

/** 三个前端应用共用的本地后端就绪检测与代理配置，仅开发模式启用。 */
export const crmDevBackend = (
  options: { target?: string; startupTimeoutMs?: number } = {}
): Plugin => {
  const target = options.target ?? 'http://127.0.0.1:3000'
  const logger = createLogger()
  const reportError = logger.error.bind(logger)
  let unavailable = false

  const reportUnavailable = () => {
    if (unavailable) return
    unavailable = true
    logger.info('[CRM] 后端暂不可用，等待服务恢复。')
  }

  logger.error = (message, logOptions) => {
    if (message.includes('http proxy error:') && isBackendConnectionError(logOptions?.error)) {
      reportUnavailable()
      return
    }
    reportError(message, logOptions)
  }

  return {
    name: 'crm-dev-backend',
    apply: 'serve',
    config: () => ({
      customLogger: logger,
      server: {
        proxy: {
          '/api': {
            target,
            changeOrigin: true,
            configure: proxy => {
              proxy.on('error', (error, _request, response) => {
                if (!isBackendConnectionError(error)) return
                reportUnavailable()
                if (!('writeHead' in response) || response.headersSent || response.writableEnded)
                  return
                response.writeHead(503, {
                  'Content-Type': 'application/json; charset=utf-8',
                  'Cache-Control': 'no-store',
                  'Retry-After': '1',
                  'X-Crm-Dev-Backend-Unavailable': '1'
                })
                response.end(
                  JSON.stringify({ code: 503, data: null, msg: '后端服务暂不可用，请稍后重试' })
                )
              })
              proxy.on('proxyRes', () => {
                if (!unavailable) return
                unavailable = false
                logger.info('[CRM] 后端连接已恢复。')
              })
            }
          }
        }
      }
    }),
    configureServer: async () => {
      logger.info('[CRM] 等待后端编译及初始化完成…')
      await waitForBackend(target, options.startupTimeoutMs)
      logger.info('[CRM] 后端已就绪，启动前端。')
    }
  }
}
