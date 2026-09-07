export type FinancialChargeStatus = 'PENDING' | 'PAID' | 'CANCELLED'
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'SINPE_MOVIL' | 'OTHER'
export type FinancialCharge = {
  id: number
  reservationId: number
  amount: string
  currency: string
  status: FinancialChargeStatus
  createdAt: string
  updatedAt: string
}
export type Payment = {
  id: number
  chargeId: number
  amount: string
  status: PaymentStatus
  method: PaymentMethod
  reference: string | null
  paidAt: string
  recordedById: number
  createdAt: string
  updatedAt: string
}
export type FinancialChargeDetail = FinancialCharge & { payments: Payment[] }
export type FinancialChargeListFilters = { status?: FinancialChargeStatus; reservationId?: number; page?: number; limit?: number }
export type PaginatedFinancialCharges = { data: FinancialCharge[]; total: number; page: number; limit: number }
export type RecordPaymentInput = { amount: string; method: PaymentMethod; reference?: string }
export const FINANCIAL_CHARGE_STATUSES: readonly FinancialChargeStatus[] = ['PENDING', 'PAID', 'CANCELLED']
export const PAYMENT_METHODS: readonly PaymentMethod[] = ['CASH', 'BANK_TRANSFER', 'SINPE_MOVIL', 'OTHER']