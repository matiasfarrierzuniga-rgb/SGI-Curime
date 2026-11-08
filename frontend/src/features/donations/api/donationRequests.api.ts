import { httpClient } from '@/shared/api/httpClient'

export type DonationRequestInput = {
  donorName: string
  email?: string
  phone?: string
  kind: 'MONETARY' | 'IN_KIND'
  modality: 'DIGITAL' | 'IN_PERSON' | 'COORDINATED'
  paymentPreference?: 'SINPE' | 'BANK_TRANSFER'
  approximateAmount?: string
  goodsDescription?: string
  comments?: string
  anonymousPublic: boolean
}

export type DonationRequest = DonationRequestInput & {
  id: string
  status: 'PENDING' | 'IN_REVIEW' | 'REJECTED' | 'CANCELLED'
  reviewReason?: string | null
  reviewedById?: number | null
  reviewedAt?: string | null
  createdAt: string
}

export const donationRequestsApi = {
  async create(input: DonationRequestInput, key: string) {
    return (await httpClient.post<{ id: string; status: 'PENDING' }>('/public/donation-requests', input, { headers: { 'Idempotency-Key': key } })).data
  },
  async list(page: number) {
    return (await httpClient.get<{ data: DonationRequest[]; total: number; page: number; limit: number }>('/donation-requests', { params: { page, limit: 20 } })).data
  },
  async transition(id: string, action: 'review' | 'reject' | 'cancel', reason?: string) {
    return (await httpClient.patch<DonationRequest>(`/donation-requests/${id}/${action}`, reason ? { reason } : {})).data
  },
}
