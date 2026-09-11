import { httpClient } from '@/shared/api/httpClient'
import type { Assembly, AssemblyDetail, AssemblyPayload, EligibleAffiliate, MineAssembly } from '../model/assemblies.types'

export const assembliesApi = {
  list: async () => (await httpClient.get<{ data: Assembly[] }>('/assemblies', { params: { page: 1, limit: 100 } })).data.data,
  detail: async (id: number) => (await httpClient.get<AssemblyDetail>(`/assemblies/${id}`)).data,
  mine: async () => (await httpClient.get<MineAssembly[]>('/assemblies/mine')).data,
  eligible: async () => (await httpClient.get<EligibleAffiliate[]>('/assemblies/eligible-affiliates')).data,
  create: async (payload: AssemblyPayload) => (await httpClient.post<Assembly>('/assemblies', payload)).data,
  update: async (id: number, payload: Partial<AssemblyPayload> & { status?: string }) => (await httpClient.patch<Assembly>(`/assemblies/${id}`, payload)).data,
  replaceConvocations: async (id: number, affiliateIds: number[]) => (await httpClient.put(`/assemblies/${id}/convocations`, { affiliateIds })).data,
  start: async (id: number) => (await httpClient.post(`/assemblies/${id}/start`)).data,
  complete: async (id: number) => (await httpClient.post(`/assemblies/${id}/complete`)).data,
  remove: async (id: number) => (await httpClient.delete(`/assemblies/${id}`)).data,
  attendance: async (id: number, entries: { affiliateId: number; status: 'PRESENT' | 'ABSENT' }[]) => (await httpClient.put(`/assemblies/${id}/attendance`, { entries })).data,
}
