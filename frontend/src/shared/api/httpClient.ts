import axios from 'axios'
import { env } from '@/shared/config/env'
import { sessionStorageService } from '@/shared/session/sessionStorage'

export const httpClient = axios.create({ baseURL: env.apiUrl, headers: { 'Content-Type': 'application/json', Accept: 'application/json' } })

httpClient.interceptors.request.use((config) => {
  const token = sessionStorageService.get()?.token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

httpClient.interceptors.response.use(response => response, (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    sessionStorageService.clear()
    window.dispatchEvent(new Event('auth:unauthorized'))
  }
  return Promise.reject(error)
})
