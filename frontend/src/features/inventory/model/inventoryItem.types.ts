import type { PaginatedResponse } from '@/shared/api/api.types'

export type InventoryItemStatus = 'ACTIVE' | 'INACTIVE'
export type InventoryItemCondition = 'GOOD' | 'DAMAGED' | 'UNDER_REPAIR'

export interface InventoryItemCategory {
  id: number
  name: string
  isActive: boolean
}

export interface InventoryItem {
  id: number
  code: string
  name: string
  description: string | null
  currentQuantity: number
  minimumQuantity: number
  unit: string
  location: string | null
  status: InventoryItemStatus
  condition: InventoryItemCondition
  categoryId: number
  category: InventoryItemCategory
  createdAt: string
  updatedAt: string
}

export interface InventoryItemQuery {
  search?: string
  code?: string
  categoryId?: number
  status?: InventoryItemStatus
  lowStock?: boolean
  page?: number
  limit?: number
}

export type InventoryItemListResponse = PaginatedResponse<InventoryItem>
