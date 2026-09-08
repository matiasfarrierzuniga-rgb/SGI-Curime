import { httpClient } from '@/shared/api/httpClient'
import type {
  CreateFinancialMovementInput,
  FinancialChargeDetail,
  FinancialChargeListFilters,
  FinancialMovement,
  FinancialMovementDetail,
  FinancialMovementListFilters,
  FinancialMovementListResponse,
  FinancialMovementSummary,
  PaginatedFinancialCharges,
  RecordPaymentInput,
} from '../model/financial.types'

export const financialApi = {
  async listCharges(filters: FinancialChargeListFilters) { return (await httpClient.get<PaginatedFinancialCharges>('/financial/charges', { params: filters })).data },
  async getCharge(id: number) { return (await httpClient.get<FinancialChargeDetail>(`/financial/charges/${id}`)).data },
  async recordPayment(id: number, payload: RecordPaymentInput) { return (await httpClient.post(`/financial/charges/${id}/payments`, payload)).data },
  async listMovements(filters: FinancialMovementListFilters) { return (await httpClient.get<FinancialMovementListResponse>('/financial/movements', { params: filters })).data },
  async getMovement(id: number) { return (await httpClient.get<FinancialMovementDetail>(`/financial/movements/${id}`)).data },
  async getMovementSummary(filters: Pick<FinancialMovementListFilters, 'dateFrom' | 'dateTo'>) { return (await httpClient.get<FinancialMovementSummary>('/financial/movements/summary', { params: filters })).data },
  async createMovement(payload: CreateFinancialMovementInput) { return (await httpClient.post<FinancialMovement>('/financial/movements', payload)).data },
}
