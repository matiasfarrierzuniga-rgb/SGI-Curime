import { httpClient } from '@/shared/api/httpClient'
import type { FinancialChargeDetail, FinancialChargeListFilters, PaginatedFinancialCharges, RecordPaymentInput, RecordPaymentResponse } from '../model/financial.types'

export const financialApi = {
  async listCharges(filters: FinancialChargeListFilters) { return (await httpClient.get<PaginatedFinancialCharges>('/financial/charges', { params: filters })).data },
  async getCharge(id: number) { return (await httpClient.get<FinancialChargeDetail>(`/financial/charges/${id}`)).data },
  async recordPayment(id: number, payload: RecordPaymentInput) { return (await httpClient.post<RecordPaymentResponse>(`/financial/charges/${id}/payments`, payload)).data },
}
