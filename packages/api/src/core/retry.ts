import axios, { type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import type { ApiRequestConfig } from '../types'

const RETRY_DELAYS_MS = [1000, 2000, 4000, 4000]
type RetryRequestConfig = InternalAxiosRequestConfig & Pick<ApiRequestConfig, 'retryOnUnavailable'>

const waitForRetry = (delayMs: number, config: RetryRequestConfig): Promise<void> =>
  new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const clearWaiting = () => {
      clearTimeout(timer)
      config.signal?.removeEventListener?.('abort', cancelWaiting)
      config.cancelToken?.unsubscribe(cancelWaiting)
    }
    const cancelWaiting = () => {
      clearWaiting()
      reject(new axios.CanceledError('Request canceled while waiting for backend', config))
    }
    config.signal?.addEventListener?.('abort', cancelWaiting)
    config.cancelToken?.subscribe(cancelWaiting)
    if (config.signal?.aborted || config.cancelToken?.reason) {
      cancelWaiting()
      return
    }
    timer = setTimeout(() => {
      clearWaiting()
      resolve()
    }, delayMs)
  })

/** 仅重试开发代理明确标记的暂时不可用响应，保留业务错误和写操作的原有语义。 */
export const requestWithDevRetry = async (
  adapter: AxiosAdapter,
  config: RetryRequestConfig,
  isCurrentSession: () => boolean
) => {
  const retryEnabled =
    config.retryOnUnavailable ?? ['get', 'head'].includes(config.method?.toLowerCase() ?? 'get')
  for (let attempt = 0; ; attempt++) {
    try {
      return await adapter(config)
    } catch (error) {
      if (
        !retryEnabled ||
        attempt >= RETRY_DELAYS_MS.length ||
        !axios.isAxiosError(error) ||
        error.response?.status !== 503 ||
        error.response.headers['x-crm-dev-backend-unavailable'] !== '1'
      )
        throw error
      if (!isCurrentSession()) throw new axios.CanceledError('Session changed', config)
      await waitForRetry(RETRY_DELAYS_MS[attempt], config)
      if (!isCurrentSession()) throw new axios.CanceledError('Session changed', config)
    }
  }
}
