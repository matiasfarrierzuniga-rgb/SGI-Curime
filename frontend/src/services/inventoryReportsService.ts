import { httpClient } from '@/shared/api/httpClient'
import type {
  InventoryLoansReport,
  InventoryMovementReport,
  InventoryReportQuery,
  InventoryReportSummary,
  InventoryStockListResponse,
  InventoryStockRow,
} from '../types/inventory'

export const inventoryReportsService = {
  async summary() {
    return (await httpClient.get<InventoryReportSummary>('/inventory/reports/summary')).data
  },
  async stock(params?: InventoryReportQuery) {
    return (await httpClient.get<InventoryStockListResponse>('/inventory/reports/stock', { params })).data
  },
  async movements(params?: InventoryReportQuery) {
    return (await httpClient.get<InventoryMovementReport>('/inventory/reports/movements', { params })).data
  },
  async loans(params?: InventoryReportQuery) {
    return (await httpClient.get<InventoryLoansReport>('/inventory/reports/loans', { params })).data
  },
}

export type { InventoryStockRow }