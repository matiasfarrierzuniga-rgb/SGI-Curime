import { httpClient } from '../api/httpClient'
import type {
  CreateLoanInput,
  InventoryLoan,
  InventoryLoanListResponse,
  InventoryLoanQuery,
  ReturnLoanInput,
} from '../types/inventory'

export const inventoryLoansService = {
  async list(params: InventoryLoanQuery) {
    return (await httpClient.get<InventoryLoanListResponse>('/inventory/loans', { params })).data
  },
  async get(id: number) {
    return (await httpClient.get<InventoryLoan>(`/inventory/loans/${id}`)).data
  },
  async create(payload: CreateLoanInput) {
    return (await httpClient.post<InventoryLoan>('/inventory/loans', payload)).data
  },
  async return(id: number, payload: ReturnLoanInput) {
    return (await httpClient.patch<InventoryLoan>(`/inventory/loans/${id}/return`, payload)).data
  },
  async cancel(id: number) {
    return (await httpClient.patch<InventoryLoan>(`/inventory/loans/${id}/cancel`)).data
  },
}