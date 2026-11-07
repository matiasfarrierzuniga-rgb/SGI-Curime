export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type IdentityLookupResult =
  | {
      found: true
      normalizedIdentification: string
      identificationType: 'NATIONAL' | 'DIMEX'
      sourceIdentificationType: string
      nombreCompleto: string
      suggestedNames: {
        firstName: string
        firstSurname: string
        secondSurname: string
      }
    }
  | {
      found: false
      normalizedIdentification: string
      message: string
    }

/** Historical and administrative UserRequest read model. */
export interface UserRequest {
  id: number
  fullName: string
  identificationType: 'NATIONAL' | 'DIMEX'
  identification: string
  email: string
  phoneCountryCode: string | null
  phoneNationalNumber: string | null
  phone: string | null
  address: string | null
  reason: string
  status: RequestStatus
  rejectionReason: string | null
  reviewedAt: string | null
  reviewedById: number | null
  createdAt: string
  updatedAt: string
}

export interface UserRequestQuery { page?: number; limit?: number; status?: RequestStatus; email?: string; identification?: string }
