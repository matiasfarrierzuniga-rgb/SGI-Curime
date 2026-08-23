import { httpClient } from '@/shared/api/httpClient'
import type { InventoryAlerts } from '../types/inventory'

export const inventoryAlertsService = {
  async get() {
    return (await httpClient.get<InventoryAlerts>('/inventory/alerts')).data
  },
}