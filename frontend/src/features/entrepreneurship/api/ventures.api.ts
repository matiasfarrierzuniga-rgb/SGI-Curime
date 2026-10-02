import { httpClient } from '@/shared/api/httpClient'
import type { Venture, VentureInput, VenturesFilters, VenturesPage } from '../model/ventures.types'

export const venturesApi = {
  async list(filters: VenturesFilters) {
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''))
    return (await httpClient.get<VenturesPage>('/ventures', { params })).data
  },
  async get(id: number) {
    return (await httpClient.get<Venture>(`/ventures/${id}`)).data
  },
  async create(input: Required<Pick<VentureInput, 'name' | 'incorporatedAt'>> & VentureInput) {
    return (await httpClient.post<Venture>('/ventures', input)).data
  },
  async update(id: number, input: VentureInput) {
    return (await httpClient.patch<Venture>(`/ventures/${id}`, input)).data
  },
}
