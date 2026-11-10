import axios, { type AxiosRequestConfig } from 'axios'
import { env } from '@/shared/config/env'
import { getAuthSessionAdapter } from './authSessionAdapter'

type RetryableRequestConfig = AxiosRequestConfig & { _retry?: boolean; _sessionEpoch?: number }

export const httpClient = axios.create({ baseURL: env.apiUrl, withCredentials: true, headers: { 'Content-Type': 'application/json', Accept: 'application/json' } })
let refreshInFlight: Promise<string> | null = null
const sessionEndpoints = new Set(['/login', '/auth/login', '/refresh', '/auth/refresh', '/logout', '/auth/logout', '/auth/logout-all'])

function isSessionEndpoint(url: string | undefined) {
  return url !== undefined && sessionEndpoints.has(url)
}

httpClient.interceptors.request.use((config) => {
  if (isSessionEndpoint(config.url)) return config
  const adapter = getAuthSessionAdapter()
  const token = adapter?.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    ;(config as RetryableRequestConfig)._sessionEpoch = adapter?.getSessionEpoch()
  }
  return config
})

function refreshAccessToken() {
  if (!refreshInFlight) {
    const adapter = getAuthSessionAdapter()
    refreshInFlight = (adapter
      ? adapter.renewAccessToken()
      : Promise.reject(new Error('No auth session adapter configured'))
    ).finally(() => { refreshInFlight = null })
  }
  return refreshInFlight
}

httpClient.interceptors.response.use(response => response, async (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 403) {
    void getAuthSessionAdapter()?.refreshAccessContext()
  }
  if (!axios.isAxiosError(error) || error.response?.status !== 401) return Promise.reject(error)

  const request = error.config as RetryableRequestConfig | undefined
  const url = request?.url
  const adapter = getAuthSessionAdapter()
  if (!request || !adapter || request._retry || isSessionEndpoint(url) || request._sessionEpoch !== adapter.getSessionEpoch()) return Promise.reject(error)

  request._retry = true
  try {
    const token = await refreshAccessToken()
    if (request._sessionEpoch !== adapter.getSessionEpoch()) return Promise.reject(error)
    request.headers = request.headers ?? {}
    request.headers.Authorization = `Bearer ${token}`
    return httpClient.request(request)
  } catch {
    if (request._sessionEpoch === adapter.getSessionEpoch()) adapter.invalidateSession('renewal-failed')
    return Promise.reject(error)
  }
})
