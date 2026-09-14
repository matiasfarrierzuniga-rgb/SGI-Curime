import { httpClient } from '@/shared/api/httpClient'
import type {
  InventoryLoansReport,
  InventoryMovementReport,
  InventoryReportQuery,
  InventoryReportSummary,
  InventoryStockListResponse,
  InventoryStockRow,
} from '../types/inventory'

type ReportEnvelope<T> = { data: T }

export const inventoryReportsService = {
  async summary() {
    return (await httpClient.get<ReportEnvelope<InventoryReportSummary>>('/inventory/reports/summary')).data.data
  },
  async stock(params?: InventoryReportQuery) {
    return (await httpClient.get<ReportEnvelope<InventoryStockListResponse>>('/inventory/reports/stock', { params })).data.data
  },
  async movements(params?: InventoryReportQuery) {
    return (await httpClient.get<ReportEnvelope<InventoryMovementReport>>('/inventory/reports/movements', { params })).data.data
  },
  async loans(params?: InventoryReportQuery) {
    return (await httpClient.get<ReportEnvelope<InventoryLoansReport>>('/inventory/reports/loans', { params })).data.data
  },
}

export type { InventoryStockRow }
