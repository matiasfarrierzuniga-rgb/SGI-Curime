import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { type PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { inventoryItemsService } from '../../../services/inventoryItemsService'
import type { InventoryItemListResponse } from '../../../types/inventory'
import { useInventoryItem, useInventoryItems, useUpdateInventoryItem } from './useInventoryQueries'

vi.mock('../../../services/inventoryItemsService', () => ({
  inventoryItemsService: {
    list: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
  },
}))

const response: InventoryItemListResponse = {
  data: [],
  total: 0,
  page: 1,
  limit: 10,
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useInventoryItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(inventoryItemsService.list).mockResolvedValue(response)
  })

  it('loads the inventory list with normalized backend filters', async () => {
    const { result } = renderHook(
      () =>
        useInventoryItems({
          search: '  computadora ',
          code: ' ADI-PC ',
          categoryId: 2,
          status: 'ACTIVE',
          lowStock: true,
          page: 2,
          limit: 20,
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(inventoryItemsService.list).toHaveBeenCalledWith({
      search: 'computadora',
      code: 'ADI-PC',
      categoryId: 2,
      status: 'ACTIVE',
      lowStock: true,
      page: 2,
      limit: 20,
    })
    expect(result.current.data).toEqual(response)
  })

  it('exposes the service error without replacing it', async () => {
    const error = new Error('Inventory unavailable')
    vi.mocked(inventoryItemsService.list).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useInventoryItems(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBe(error)
    expect(inventoryItemsService.list).toHaveBeenCalledWith({
      search: undefined,
      code: undefined,
      categoryId: undefined,
      status: undefined,
      lowStock: undefined,
      page: 1,
      limit: 10,
    })
  })
})

describe('useInventoryItem', () => {
  it('loads a valid item id and stays disabled for invalid ids', async () => {
    const item = { id: 7, code: 'ADI-007' }
    vi.mocked(inventoryItemsService.get).mockResolvedValue(item as never)

    const { result, rerender } = renderHook(({ id }) => useInventoryItem(id), {
      initialProps: { id: null as number | null },
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')

    rerender({ id: 7 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(inventoryItemsService.get).toHaveBeenCalledWith(7)
  })
})

describe('useUpdateInventoryItem', () => {
  it('updates the item and invalidates list and detail queries', async () => {
    vi.mocked(inventoryItemsService.update).mockResolvedValue({ id: 7 } as never)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useUpdateInventoryItem(), { wrapper })

    await result.current.mutateAsync({
      id: 7,
      data: { name: 'Computadora actualizada', categoryId: 2 },
    })

    expect(inventoryItemsService.update).toHaveBeenCalledWith(7, {
      name: 'Computadora actualizada',
      categoryId: 2,
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['inventory', 'items'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['inventory', 'items', 'detail', 7] })
  })
})
