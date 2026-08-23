import { httpClient } from '@/shared/api/httpClient'
import type { AffiliateRequest, AffiliateRequestList, AffiliateRequestQuery, CreateAffiliateRequest } from '../types/affiliateRequests'

export const affiliateRequestsService = {
  async list(params: AffiliateRequestQuery) { return (await httpClient.get<AffiliateRequestList>('/affiliate-requests', { params })).data },
  async get(id: number) { return (await httpClient.get<AffiliateRequest>(`/affiliate-requests/${id}`)).data },
  async create(payload: CreateAffiliateRequest) { return (await httpClient.post<AffiliateRequest>('/affiliate-requests', payload)).data },
  async approve(id: number) { return (await httpClient.patch(`/affiliate-requests/${id}/approve`)).data },
  async reject(id: number, rejectionReason: string) { return (await httpClient.patch<AffiliateRequest>(`/affiliate-requests/${id}/reject`, { rejectionReason })).data },
}
