import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { affiliatesService } from '../api/affiliates.api'
import { affiliatesKeys, useAffiliateDetail, useAffiliateMutations, useAffiliatesList } from './useAffiliatesQueries'

vi.mock('../api/affiliates.api', () => ({
  affiliatesService: { list: vi.fn(), detail: vi.fn(), update: vi.fn(), activate: vi.fn(), deactivate: vi.fn() },
}))

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  return { queryClient, wrapper }
}

describe('affiliate query foundation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses distinct list keys when any contract filter changes', () => {
    const base = { search: 'Ana', name: 'Ana', identification: '1', status: 'ACTIVE' as const, page: 1, limit: 20 }

    expect(affiliatesKeys.list(base)).not.toEqual(affiliatesKeys.list({ ...base, search: 'Bea' }))
    expect(affiliatesKeys.list(base)).not.toEqual(affiliatesKeys.list({ ...base, name: 'Bea' }))
    expect(affiliatesKeys.list(base)).not.toEqual(affiliatesKeys.list({ ...base, identification: '2' }))
    expect(affiliatesKeys.list(base)).not.toEqual(affiliatesKeys.list({ ...base, status: 'INACTIVE' }))
    expect(affiliatesKeys.list(base)).not.toEqual(affiliatesKeys.list({ ...base, page: 2 }))
    expect(affiliatesKeys.list(base)).not.toEqual(affiliatesKeys.list({ ...base, limit: 10 }))
  })

  it('normalizes backend pagination defaults before listing', async () => {
    vi.mocked(affiliatesService.list).mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 })
    const { wrapper } = createWrapper()

    renderHook(() => useAffiliatesList({ search: ' Ana ' }), { wrapper })

    await waitFor(() => expect(affiliatesService.list).toHaveBeenCalledWith({ search: 'Ana', name: undefined, identification: undefined, status: undefined, page: 1, limit: 20 }))
  })

  it('disables detail when no valid id exists', () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useAffiliateDetail(null), { wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(affiliatesService.detail).not.toHaveBeenCalled()
  })

  it.each([
    ['update', (mutations: ReturnType<typeof useAffiliateMutations>) => mutations.update.mutateAsync({ id: 7, payload: { fullName: 'Ana' } }), 'update'],
    ['activate', (mutations: ReturnType<typeof useAffiliateMutations>) => mutations.activate.mutateAsync(7), 'activate'],
    ['deactivate', (mutations: ReturnType<typeof useAffiliateMutations>) => mutations.deactivate.mutateAsync(7), 'deactivate'],
  ])('invalidates list and detail after %s', async (_name, runMutation, method) => {
    vi.mocked(affiliatesService[method]).mockResolvedValue({ id: 7 } as never)
    const { queryClient, wrapper } = createWrapper()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useAffiliateMutations(), { wrapper })

    await runMutation(result.current)

    expect(invalidate).toHaveBeenCalledWith({ queryKey: affiliatesKeys.all })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: affiliatesKeys.detail(7) })
  })
})
