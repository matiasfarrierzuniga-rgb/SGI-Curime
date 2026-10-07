import { httpClient } from '@/shared/api/httpClient'
import type {
  InventoryItem,
  InventoryItemListResponse,
  InventoryItemQuery,
} from '../model/inventoryItem.types'

export const inventoryItemsApi = {
  async list(params: InventoryItemQuery) {
    return (
      await httpClient.get<InventoryItemListResponse>('/inventory/items', {
        params,
      })
    ).data
  },
  async get(id: number) {
    return (await httpClient.get<InventoryItem>(`/inventory/items/${id}`)).data
  },
}
