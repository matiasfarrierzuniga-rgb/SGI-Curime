import axios, { type AxiosRequestConfig } from 'axios'
import { env } from '@/shared/config/env'
import { sessionStorageService } from '@/shared/session/sessionStorage'

type RetryableRequestConfig = AxiosRequestConfig & { _retry?: boolean }
interface StoredTokenSession { token: string; user: unknown }

export const httpClient = axios.create({ baseURL: env.apiUrl, withCredentials: true, headers: { 'Content-Type': 'application/json', Accept: 'application/json' } })
let refreshInFlight: Promise<string> | null = null

httpClient.interceptors.request.use((config) => {
  const token = sessionStorageService.get<{ token?: string }>()?.token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

function refreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = httpClient.post<{ accessToken: string }>('/refresh').then(({ data }) => {
      const session = sessionStorageService.get<StoredTokenSession>()
      if (session) sessionStorageService.set({ ...session, token: data.accessToken })
      window.dispatchEvent(new CustomEvent('auth:token-refreshed', { detail: data.accessToken }))
      return data.accessToken
    }).finally(() => { refreshInFlight = null })
  }
  return refreshInFlight
}

httpClient.interceptors.response.use(response => response, async (error: unknown) => {
  if (!axios.isAxiosError(error) || error.response?.status !== 401) return Promise.reject(error)

  const request = error.config as RetryableRequestConfig | undefined
  const url = request?.url
  if (!request || request._retry || url === '/refresh' || url === '/login' || url === '/logout') return Promise.reject(error)

  request._retry = true
  try {
    const token = await refreshAccessToken()
    request.headers = request.headers ?? {}
    request.headers.Authorization = `Bearer ${token}`
    return httpClient.request(request)
  } catch {
    window.dispatchEvent(new Event('auth:unauthorized'))
    return Promise.reject(error)
  }
})
