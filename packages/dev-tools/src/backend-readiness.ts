import { setTimeout as delay } from 'node:timers/promises'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** 只等待 HTTP 就绪，不启动、停止或重启后端进程。 */
export const waitForBackend = async (
  target: string,
  timeoutMs = 60000,
  intervalMs = 500
): Promise<void> => {
  const deadline = Date.now() + timeoutMs
  const healthUrl = new URL('/api/health', target)
  while (Date.now() < deadline) {
    try {
      const response = await fetch(healthUrl, {
        signal: AbortSignal.timeout(Math.max(1, Math.min(1500, deadline - Date.now()))),
        redirect: 'error'
      })
      const result = response.ok ? await response.json() : null
      if (
        isRecord(result) &&
        result.code === 200 &&
        isRecord(result.data) &&
        result.data.service === 'common-crm-serve' &&
        result.data.status === 'ready'
      )
        return
      if (!response.ok) await response.body?.cancel()
    } catch {
      // 编译和模块初始化期间尚未监听端口，继续等待至期限。
    }
    await delay(Math.max(0, Math.min(intervalMs, deadline - Date.now())))
  }
  throw new Error(
    `后端在 ${timeoutMs / 1000} 秒内未就绪，请检查后端编译、数据库连接和端口配置：${healthUrl.origin}`
  )
}

export const isBackendConnectionError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false
  if ('code' in error && ['ECONNREFUSED', 'ECONNRESET', 'EPIPE'].includes(String(error.code)))
    return true
  return (
    error instanceof AggregateError &&
    error.errors.length > 0 &&
    error.errors.every(isBackendConnectionError)
  )
}
