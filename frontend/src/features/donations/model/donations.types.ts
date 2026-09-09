export type DonationStatus = 'CONFIRMED' | 'CANCELLED'

export type DonationMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'SINPE_MOVIL'
  | 'OTHER'

export interface DonationActorSummary {
  id: number
  fullName: string
}

export interface Donation {
  id: number
  donorName: string | null
  donorIdentification: string | null
  amount: string
  currency: string
  method: DonationMethod
  reference: string | null
  description: string | null
  receivedAt: string
  status: DonationStatus
  recordedById: number
  cancelledById: number | null
  cancelledAt: string | null
  cancellationReason: string | null
  originalMovementId: number | null
  reversalMovementId: number | null
  createdAt: string
  updatedAt: string
  recordedBy?: DonationActorSummary
  cancelledBy?: DonationActorSummary | null
}

export interface CreateDonationInput {
  donorName?: string
  donorIdentification?: string
  amount: string
  method: DonationMethod
  reference?: string
  description?: string
  receivedAt: string
}

export interface UpdateDonationInput {
  donorName?: string
  donorIdentification?: string
  amount?: string
  method?: DonationMethod
  reference?: string
  description?: string
  receivedAt?: string
}

export interface CancelDonationInput {
  cancellationReason: string
}

export interface DonationListFilters {
  search?: string
  status?: DonationStatus
  method?: DonationMethod
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export interface DonationListResponse {
  data: Donation[]
  total: number
  page: number
  limit: number
}

export interface DeleteDonationResponse {
  deleted: true
  id: number
}
