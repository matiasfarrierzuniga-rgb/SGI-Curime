import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/shared/api/httpClient'
import {
  inventoryKeys,
  useInventoryItem,
  useInventoryItems,
} from '../index'
import type {
  InventoryItem,
  InventoryItemListResponse,
  InventoryItemQuery,
} from '../index'

vi.mock('@/shared/api/httpClient', () => ({
  httpClient: { get: vi.fn() },
}))

const item: InventoryItem = {
  id: 7,
  code: 'HER-007',
  name: 'Martillo',
  description: null,
  currentQuantity: 4,
  minimumQuantity: 2,
  unit: 'unidad',
  location: null,
  status: 'ACTIVE',
  condition: 'GOOD',
  categoryId: 3,
  category: { id: 3, name: 'Herramientas', isActive: true },
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-02T00:00:00.000Z',
}

const itemList: InventoryItemListResponse = {
  data: [item],
  total: 1,
  page: 1,
  limit: 20,
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, wrapper }
}

describe('inventory query hooks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('includes every supported filter and page in the list query key', () => {
    const filters = {
      search: '  martillo ',
      code: ' HER-007 ',
      categoryId: 3,
      status: 'ACTIVE',
      lowStock: true,
      page: 2,
      limit: 10,
    } satisfies InventoryItemQuery

    expect(inventoryKeys.list(filters)).toEqual(
      inventoryKeys.list({ ...filters, search: 'martillo', code: 'HER-007' }),
    )

    const normalizedFilters = {
      ...filters,
      search: 'martillo',
      code: 'HER-007',
    }
    for (const changed of [
      { search: 'otro' },
      { code: 'HER-008' },
      { categoryId: 4 },
      { status: 'INACTIVE' },
      { lowStock: false },
      { page: 1 },
      { limit: 20 },
    ]) {
      expect(inventoryKeys.list(normalizedFilters)).not.toEqual(
        inventoryKeys.list({ ...normalizedFilters, ...changed }),
      )
    }
  })

  it('requests a filtered, paginated list and exposes its result', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: itemList } as never)
    const { wrapper } = createWrapper()
    const filters: InventoryItemQuery = {
      search: '  martillo ',
      code: ' HER-007 ',
      categoryId: 3,
      status: 'ACTIVE',
      lowStock: true,
      page: 2,
      limit: 10,
    }

    const { result } = renderHook(() => useInventoryItems(filters), { wrapper })

    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.data).toEqual(itemList))
    expect(httpClient.get).toHaveBeenCalledWith('/inventory/items', {
      params: {
        search: 'martillo',
        code: 'HER-007',
        categoryId: 3,
        status: 'ACTIVE',
        lowStock: true,
        page: 2,
        limit: 10,
      },
    })
  })

  it('uses backend pagination defaults when listing without parameters', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: itemList } as never)
    const { wrapper } = createWrapper()

    renderHook(() => useInventoryItems(), { wrapper })

    await waitFor(() =>
      expect(httpClient.get).toHaveBeenCalledWith('/inventory/items', {
        params: {
          search: undefined,
          code: undefined,
          categoryId: undefined,
          status: undefined,
          lowStock: undefined,
          page: 1,
          limit: 20,
        },
      }),
    )
  })

  it('loads the complete item detail by ID', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: item } as never)
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useInventoryItem(7), { wrapper })

    await waitFor(() => expect(result.current.data).toEqual(item))
    expect(httpClient.get).toHaveBeenCalledWith('/inventory/items/7')
  })

  it.each([null, undefined, 0, -1, 1.5, Number.NaN])(
    'does not request a detail for invalid ID %s',
    (id) => {
      const { wrapper } = createWrapper()
      const { result } = renderHook(() => useInventoryItem(id), { wrapper })

      expect(result.current.fetchStatus).toBe('idle')
      expect(httpClient.get).not.toHaveBeenCalled()
    },
  )

  it('exposes list and detail errors for consumers to handle', async () => {
    const error = new Error('Inventory service unavailable')
    vi.mocked(httpClient.get).mockRejectedValue(error)
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useInventoryItem(7), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBe(error)
  })
})
