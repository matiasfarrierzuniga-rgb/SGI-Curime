import type { PaginatedResponse } from '@/shared/api/api.types'

export type AffiliateRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type IdentificationType = 'NATIONAL' | 'DIMEX'

export interface AffiliateRequestReviewer {
  id: number
  fullName: string
  email: string
}

export interface AffiliateRequest {
  id: number
  fullName: string
  identification: string
  identificationType: IdentificationType | null
  birthDate: string
  gender: string | null
  phoneCountryCode: string | null
  phoneNationalNumber: string | null
  phone: string | null
  email: string | null
  address: string
  occupation: string | null
  workplace: string | null
  affiliationReason: string
  status: AffiliateRequestStatus
  rejectionReason: string | null
  reviewedAt: string | null
  reviewedById: number | null
  reviewedBy: AffiliateRequestReviewer | null
  createdAt: string
  updatedAt: string
}

export interface AffiliateRequestListFilters {
  status?: AffiliateRequestStatus
  search?: string
  email?: string
  identification?: string
  page?: number
  limit?: number
}

export type AffiliateRequestListResponse = PaginatedResponse<AffiliateRequest>

export interface RejectAffiliateRequestPayload {
  rejectionReason: string
}

export interface ApprovedAffiliate {
  id: number
  fullName: string
  identification: string
  identificationType: IdentificationType | null
  birthDate: string
  gender: string | null
  phone: string | null
  phoneCountryCode: string | null
  phoneNationalNumber: string | null
  email: string | null
  address: string
  occupation: string | null
  workplace: string | null
  affiliateType: string | null
  affiliationDate: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
}

export interface ApproveAffiliateRequestResponse {
  affiliate: ApprovedAffiliate
  affiliateRequest: AffiliateRequest
}
