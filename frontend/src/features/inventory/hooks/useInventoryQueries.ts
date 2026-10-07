import { useQuery } from '@tanstack/react-query'
import { inventoryItemsApi } from '../api/inventoryItems.api'
import type { InventoryItemQuery } from '../model/inventoryItem.types'

type NormalizedInventoryItemQuery = Required<
  Pick<InventoryItemQuery, 'page' | 'limit'>
> &
  Omit<InventoryItemQuery, 'page' | 'limit'>

function normalizeInventoryItemQuery(
  query: InventoryItemQuery,
): NormalizedInventoryItemQuery {
  return {
    search: query.search?.trim() || undefined,
    code: query.code?.trim() || undefined,
    categoryId: query.categoryId,
    status: query.status,
    lowStock: query.lowStock,
    page: query.page ?? 1,
    limit: query.limit ?? 20,
  }
}

function isValidInventoryItemId(
  id: number | null | undefined,
): id is number {
  return typeof id === 'number' && Number.isInteger(id) && id > 0
}

export const inventoryKeys = {
  all: ['inventory'] as const,
  items: () => [...inventoryKeys.all, 'items'] as const,
  list: (query: InventoryItemQuery) =>
    [
      ...inventoryKeys.items(),
      'list',
      normalizeInventoryItemQuery(query),
    ] as const,
  detail: (id: number | null) =>
    [...inventoryKeys.items(), 'detail', id ?? 0] as const,
}

export function useInventoryItems(query: InventoryItemQuery = {}) {
  const normalizedQuery = normalizeInventoryItemQuery(query)

  return useQuery({
    queryKey: inventoryKeys.list(query),
    queryFn: () => inventoryItemsApi.list(normalizedQuery),
  })
}

export function useInventoryItem(id: number | null | undefined) {
  const validId = isValidInventoryItemId(id)

  return useQuery({
    queryKey: inventoryKeys.detail(validId ? id : null),
    queryFn: () => {
      if (!isValidInventoryItemId(id)) {
        throw new Error('A valid inventory item ID is required')
      }
      return inventoryItemsApi.get(id)
    },
    enabled: validId,
  })
}
