import { httpClient } from '@/shared/api/httpClient'
import type { InventoryMovementListResponse, InventoryMovementQuery } from '../types/inventory'

export const inventoryMovementsService = {
  async list(params: InventoryMovementQuery) {
    return (await httpClient.get<InventoryMovementListResponse>('/inventory/movements', { params })).data
  },
}