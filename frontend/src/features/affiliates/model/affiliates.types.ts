import type { PaginatedResponse } from '@/shared/api/api.types'

export type AffiliateStatus = 'ACTIVE' | 'INACTIVE'

export interface Affiliate {
  id: number
  fullName: string
  identification: string
  identificationType: 'NATIONAL' | 'DIMEX' | null
  birthDate: string
  gender: string | null
  phoneCountryCode: string | null
  phoneNationalNumber: string | null
  phone: string | null
  email: string | null
  address: string
  occupation: string | null
  workplace: string | null
  affiliateType: string | null
  affiliationDate: string
  status: AffiliateStatus
  createdAt: string
  updatedAt: string
}

export interface AffiliateUpdate {
  fullName?: string
  identificationType?: 'NATIONAL' | 'DIMEX'
  identification?: string
  birthDate?: string
  gender?: string
  phoneCountryCode?: string
  phoneNationalNumber?: string
  email?: string
  address?: string
  occupation?: string
  workplace?: string
  affiliateType?: string
}

export interface AffiliateListFilters {
  name?: string
  identification?: string
  status?: AffiliateStatus
  search?: string
  page?: number
  limit?: number
}

export type AffiliateListResponse = PaginatedResponse<Affiliate>
