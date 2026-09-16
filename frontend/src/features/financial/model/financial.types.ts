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

export type FinancialMovementType = 'INCOME' | 'EXPENSE'
export type FinancialMovementSource = 'MANUAL' | 'RESERVATION_PAYMENT' | 'DONATION'
export type FinancialMovement = {
  id: number
  type: FinancialMovementType
  source: FinancialMovementSource
  amount: string
  currency: string
  description: string
  reference: string | null
  occurredAt: string
  sourceId: number | null
  recordedById: number | null
  createdAt: string
  updatedAt: string
}
export type FinancialMovementDetail = FinancialMovement & {
  recordedBy: { id: number; fullName: string } | null
}
export type CreateFinancialMovementInput = {
  type: FinancialMovementType
  amount: string
  description: string
  reference?: string
  occurredAt: string
}
export type FinancialMovementListFilters = {
  type?: FinancialMovementType
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}
export type FinancialMovementListResponse = {
  data: FinancialMovement[]
  total: number
  page: number
  limit: number
}
export type FinancialMovementSummary = {
  currency: string
  totalIncome: string
  totalExpenses: string
  balance: string
}
export const FINANCIAL_MOVEMENT_TYPES: readonly FinancialMovementType[] = ['INCOME', 'EXPENSE']

export type DinadecoSourceSummary = { total: string; count: number }
export type DinadecoAnnualReport = {
  metadata: {
    generatedAt: string
    generatedBy: { id: number; fullName: string } | null
    period: { from: string; to: string }
    appliedFilters: { year: number }
    dataSource: 'FINANCIAL_MOVEMENT'
    reportVersion: string
  }
  data: {
    year: number
    currency: 'CRC'
    openingBalance: string
    income: { total: string; count: number; bySource: Partial<Record<FinancialMovementSource, DinadecoSourceSummary>> }
    expenses: { total: string; count: number; bySource: Partial<Record<FinancialMovementSource, DinadecoSourceSummary>> }
    netMovement: string
    closingBalance: string
    movementCount: number
  }
}
