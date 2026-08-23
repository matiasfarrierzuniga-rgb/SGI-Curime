import type { PaginatedResponse } from './api'
import type { IdentificationType } from '@/shared/lib/formValidation'

export type AffiliateRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export interface AffiliateRequest {
  id: number; fullName: string; identificationType: IdentificationType; identification: string;
  birthDate: string; gender: string | null; phoneCountryCode: string | null;
  phoneNationalNumber: string | null; email: string | null; address: string;
  phone: string | null;
  occupation: string | null; workplace: string | null; affiliationReason: string;
  status: AffiliateRequestStatus; rejectionReason: string | null; createdAt: string; updatedAt: string;
}
export interface CreateAffiliateRequest {
  fullName: string; identificationType: IdentificationType; identification: string;
  birthDate: string; gender?: string; phoneCountryCode?: string;
  phoneNationalNumber?: string; email?: string; address: string;
  occupation?: string; workplace?: string; affiliationReason: string;
}
export interface AffiliateRequestQuery { status?: AffiliateRequestStatus; search?: string; page: number; limit: number }
export type AffiliateRequestList = PaginatedResponse<AffiliateRequest>
