import { httpClient } from '@/shared/api/httpClient'
import type { Affiliate, AffiliateListFilters, AffiliateListResponse, AffiliateUpdate } from '../model/affiliates.types'

export const affiliatesService = {
  async list(filters: AffiliateListFilters) {
    return (await httpClient.get<AffiliateListResponse>('/affiliates', { params: filters })).data
  },
  async detail(id: number) {
    return (await httpClient.get<Affiliate>(`/affiliates/${id}`)).data
  },
  async update(id: number, payload: AffiliateUpdate) {
    return (await httpClient.patch<Affiliate>(`/affiliates/${id}`, payload)).data
  },
  async activate(id: number) {
    return (await httpClient.patch<Affiliate>(`/affiliates/${id}/activate`)).data
  },
  async deactivate(id: number) {
    return (await httpClient.patch<Affiliate>(`/affiliates/${id}/deactivate`)).data
  },
}
