import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig
} from 'axios'
import NProgress from 'nprogress'
import type { ApiClientConfig, ApiErrorKind, ApiRequestConfig, ApiResponse } from '../types'

let axiosInstance: AxiosInstance | null = null
let activeProgressRequests = 0

NProgress.configure({ showSpinner: false })

type InternalApiRequestConfig = InternalAxiosRequestConfig &
  Pick<ApiRequestConfig, 'requiresAuth' | 'showProgress'>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getResponseCode(data: unknown): number | undefined {
  return isRecord(data) && typeof data.code === 'number' && Number.isInteger(data.code)
    ? data.code
    : undefined
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (!isRecord(data)) return fallback
  if (typeof data.msg === 'string' && data.msg.trim()) return data.msg
  if (typeof data.message === 'string' && data.message.trim()) return data.message
  if (Array.isArray(data.message)) {
    const messages = data.message.filter(
      (message): message is string => typeof message === 'string' && !!message.trim()
    )
    if (messages.length) return messages.join('; ')
  }
  return fallback
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly cause?: unknown

  constructor(
    message: string,
    public readonly code: number,
    public readonly status?: number,
    public readonly response?: unknown,
    options: { kind?: ApiErrorKind; cause?: unknown } = {}
  ) {
    super(message)
    this.name = 'ApiError'
    this.kind = options.kind ?? 'business'
    this.cause = options.cause
  }
}

export const isRequestCanceled = axios.isCancel

function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (!axios.isAxiosError<unknown>(error)) {
    return new ApiError(
      error instanceof Error ? error.message : '请求失败',
      -1,
      undefined,
      undefined,
      {
        kind: 'unknown',
        cause: error
      }
    )
  }

  if (error.response) {
    const { status, data } = error.response
    return new ApiError(
      getErrorMessage(data, status === 401 ? '未授权，请重新登录' : '请求失败'),
      getResponseCode(data) ?? status,
      status,
      data,
      { kind: 'http', cause: error }
    )
  }

  const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
  const kind = isTimeout
    ? 'timeout'
    : error.code === 'ERR_NETWORK' || error.request
      ? 'network'
      : 'unknown'
  return new ApiError(
    isTimeout
      ? '请求超时，请稍后重试'
      : kind === 'network'
        ? '网络连接失败'
        : error.message || '请求失败',
    -1,
    undefined,
    undefined,
    { kind, cause: error }
  )
}

export function initRequest(config: ApiClientConfig): AxiosInstance {
  const instance = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout ?? 10000,
    withCredentials: config.withCredentials ?? true
  })
  let sessionToken: string | null | undefined
  let sessionVersion = 0
  let unauthorizedVersion: number | undefined
  const requestSessions = new WeakMap<
    InternalAxiosRequestConfig,
    { token: string | null; version: number }
  >()

  function getSession() {
    const token = config.getAccessToken?.() ?? null
    if (token !== sessionToken) {
      sessionToken = token
      sessionVersion++
    }
    return { token, version: sessionVersion }
  }

  async function handleUnauthorized(requestConfig: InternalApiRequestConfig | undefined) {
    if (!requestConfig || requestConfig.requiresAuth === false || !config.onUnauthorized) return
    const sentSession = requestSessions.get(requestConfig)
    const currentSession = getSession()

    // 旧会话的迟到响应不能清除新会话；同一会话的并发 401 只处理一次。
    if (
      !sentSession ||
      sentSession.version !== currentSession.version ||
      unauthorizedVersion === sentSession.version
    )
      return
    unauthorizedVersion = sentSession.version
    try {
      await config.onUnauthorized()
    } catch {
      // 保留原始请求错误，避免跳转失败覆盖业务错误。
    }
  }

  instance.interceptors.request.use((requestConfig: InternalApiRequestConfig) => {
    const session = getSession()
    if (requestConfig.requiresAuth !== false) {
      requestSessions.set(requestConfig, session)
      if (session.token && !requestConfig.headers.has('Authorization')) {
        requestConfig.headers.set('Authorization', `Bearer ${session.token}`)
      }
    }

    if ((requestConfig.showProgress ?? config.showProgress ?? true) && 'document' in globalThis) {
      const resolveAdapter: (
        adapters: Parameters<typeof axios.getAdapter>[0],
        config: InternalAxiosRequestConfig
      ) => ReturnType<typeof axios.getAdapter> = axios.getAdapter
      const adapter = resolveAdapter(
        requestConfig.adapter ?? instance.defaults.adapter,
        requestConfig
      )
      // 在实际发送时计数，finally 同时覆盖取消、网络错误和自定义 adapter 异常。
      requestConfig.adapter = async adapterConfig => {
        if (activeProgressRequests++ === 0) NProgress.start()
        try {
          return await adapter(adapterConfig)
        } finally {
          if (--activeProgressRequests === 0) NProgress.done()
        }
      }
    }
    return requestConfig
  })

  instance.interceptors.response.use(
    async (response: AxiosResponse<unknown>) => {
      const code = getResponseCode(response.data)
      if (code !== undefined && code >= 400) {
        if (code === 401) await handleUnauthorized(response.config)
        throw new ApiError(
          getErrorMessage(response.data, '请求失败'),
          code,
          response.status,
          response.data,
          { kind: 'business' }
        )
      }
      return response
    },
    async (error: unknown) => {
      if (isRequestCanceled(error)) throw error
      const apiError = normalizeError(error)
      if (axios.isAxiosError(error) && (apiError.status === 401 || apiError.code === 401)) {
        await handleUnauthorized(error.config)
      }
      throw apiError
    }
  )

  axiosInstance = instance
  return instance
}

/** 原始实例保留完整 AxiosResponse，与 AxiosInstance 类型一致。 */
export function getAxiosInstance(): AxiosInstance {
  if (!axiosInstance) {
    throw new Error('Request not initialized. Call initRequest() first.')
  }
  return axiosInstance
}

export async function requestRaw<T = unknown, D = unknown>(
  config: ApiRequestConfig<D>
): Promise<AxiosResponse<T, D>> {
  return getAxiosInstance().request<T, AxiosResponse<T, D>, D>(config)
}

/** T 表示后端 Result.data 的业务类型，返回值保留完整业务响应。 */
export async function request<T = unknown, D = unknown>(
  config: ApiRequestConfig<D>
): Promise<ApiResponse<T>> {
  const response = await requestRaw<unknown, D>(config)
  const data = response.data
  if (
    !isRecord(data) ||
    getResponseCode(data) === undefined ||
    typeof data.msg !== 'string' ||
    !('data' in data)
  ) {
    throw new ApiError('响应格式不符合后端 Result 约定', -1, response.status, data, {
      kind: 'protocol'
    })
  }
  return data as unknown as ApiResponse<T>
}
