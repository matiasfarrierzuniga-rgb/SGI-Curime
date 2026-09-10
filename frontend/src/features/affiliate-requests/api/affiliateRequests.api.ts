import { httpClient } from '@/shared/api/httpClient'
import type {
  AffiliateRequest,
  AffiliateRequestListFilters,
  AffiliateRequestListResponse,
  ApproveAffiliateRequestResponse,
  ApproveAffiliateRequestPayload,
  RejectAffiliateRequestPayload,
} from '../model/affiliateRequests.types'

export const affiliateRequestsApi = {
  async list(filters: AffiliateRequestListFilters) {
    return (await httpClient.get<AffiliateRequestListResponse>('/affiliate-requests', { params: filters })).data
  },
  async detail(id: number) {
    return (await httpClient.get<AffiliateRequest>(`/affiliate-requests/${id}`)).data
  },
  async approve(id: number, payload: ApproveAffiliateRequestPayload) {
    return (await httpClient.patch<ApproveAffiliateRequestResponse>(`/affiliate-requests/${id}/approve`, payload)).data
  },
  async reject(id: number, payload: RejectAffiliateRequestPayload) {
    return (await httpClient.patch<AffiliateRequest>(`/affiliate-requests/${id}/reject`, payload)).data
  },
}
