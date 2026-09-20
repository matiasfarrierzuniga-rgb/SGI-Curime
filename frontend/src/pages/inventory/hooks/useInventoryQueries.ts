import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { inventoryItemsService } from '../../../services/inventoryItemsService'
import type { InventoryItemQuery, UpdateInventoryItemInput } from '../../../types/inventory'

function normalizeFilters(filters: InventoryItemQuery = {}) {
  return {
    search: filters.search?.trim() || undefined,
    code: filters.code?.trim() || undefined,
    categoryId: filters.categoryId,
    status: filters.status,
    lowStock: filters.lowStock,
    page: filters.page ?? 1,
    limit: filters.limit ?? 10,
  }
}

export const inventoryKeys = {
  all: ['inventory'] as const,
  itemsRoot: () => [...inventoryKeys.all, 'items'] as const,
  items: (filters: InventoryItemQuery = {}) => [
    ...inventoryKeys.itemsRoot(),
    normalizeFilters(filters),
  ] as const,
  item: (id: number) => [...inventoryKeys.itemsRoot(), 'detail', id] as const,
}

export function useInventoryItems(filters: InventoryItemQuery = {}) {
  const normalizedFilters = normalizeFilters(filters)

  return useQuery({
    queryKey: inventoryKeys.items(normalizedFilters),
    queryFn: () => inventoryItemsService.list(normalizedFilters),
  })
}

export function useInventoryItem(id: number | null) {
  const enabled = Number.isInteger(id) && id! > 0

  return useQuery({
    queryKey: inventoryKeys.item(id ?? 0),
    queryFn: () => inventoryItemsService.get(id!),
    enabled,
  })
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateInventoryItemInput }) =>
      inventoryItemsService.update(id, data),
    onSuccess: (_item, { id }) => Promise.all([
      queryClient.invalidateQueries({ queryKey: inventoryKeys.itemsRoot() }),
      queryClient.invalidateQueries({ queryKey: inventoryKeys.item(id) }),
    ]),
  })
}
