import { httpClient } from '@/shared/api/httpClient'
import type { PublicVenture, PublicVenturesPage, PublicVenturesQuery } from '../model/publicVentures.types'

export const publicVenturesApi = {
  async list(query: PublicVenturesQuery) {
    const params = Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== ''))
    return (await httpClient.get<PublicVenturesPage>('/public/ventures', { params })).data
  },
  async get(id: number) {
    return (await httpClient.get<PublicVenture>(`/public/ventures/${id}`)).data
  },
}
