export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export interface CreateUserRequest {
  fullName: string
  firstName?: string
  firstSurname?: string
  secondSurname?: string
  identificationType: 'NATIONAL' | 'DIMEX'
  identification: string
  email: string
  phoneCountryCode?: string
  phoneNationalNumber?: string
  address?: string
  reason: string
}

/** Public POST /register result and administrative UserRequest read model. */
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
