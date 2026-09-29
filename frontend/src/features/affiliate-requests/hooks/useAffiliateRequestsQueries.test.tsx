import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { affiliateRequestsApi } from '../api/affiliateRequests.api'
import {
  affiliateRequestsKeys,
  useAffiliateRequestDetail,
  useAffiliateRequestMutations,
  useAffiliateRequestsList,
} from './useAffiliateRequestsQueries'

vi.mock('../api/affiliateRequests.api', () => ({
  affiliateRequestsApi: { list: vi.fn(), detail: vi.fn(), approve: vi.fn(), reject: vi.fn() },
}))

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  return { queryClient, wrapper }
}

describe('affiliate request query foundation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses distinct list keys for every supported filter', () => {
    const base = { status: 'PENDING' as const, search: 'Ana', email: 'ana@example.com', identification: '1', page: 1, limit: 20 }

    expect(affiliateRequestsKeys.list(base)).not.toEqual(affiliateRequestsKeys.list({ ...base, status: 'APPROVED' }))
    expect(affiliateRequestsKeys.list(base)).not.toEqual(affiliateRequestsKeys.list({ ...base, search: 'Bea' }))
    expect(affiliateRequestsKeys.list(base)).not.toEqual(affiliateRequestsKeys.list({ ...base, email: 'bea@example.com' }))
    expect(affiliateRequestsKeys.list(base)).not.toEqual(affiliateRequestsKeys.list({ ...base, identification: '2' }))
    expect(affiliateRequestsKeys.list(base)).not.toEqual(affiliateRequestsKeys.list({ ...base, page: 2 }))
    expect(affiliateRequestsKeys.list(base)).not.toEqual(affiliateRequestsKeys.list({ ...base, limit: 10 }))
  })

  it('uses one key for case-insensitive search equivalents without mutating filters', () => {
    const filters = { search: ' ANA ' }
    const original = { ...filters }

    expect(affiliateRequestsKeys.list(filters)).toEqual(affiliateRequestsKeys.list({ search: 'Ana' }))
    expect(affiliateRequestsKeys.list(filters)).toEqual(affiliateRequestsKeys.list({ search: 'ana' }))
    expect(filters).toEqual(original)
  })

  it('uses one key for empty filter equivalents', () => {
    const emptyKey = affiliateRequestsKeys.list({})

    expect(emptyKey).toEqual(affiliateRequestsKeys.list({ search: undefined }))
    expect(emptyKey).toEqual(affiliateRequestsKeys.list({ search: '' }))
    expect(emptyKey).toEqual(affiliateRequestsKeys.list({ search: '   ' }))
  })

  it('normalizes filters before listing', async () => {
    vi.mocked(affiliateRequestsApi.list).mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 })
    const { wrapper } = createWrapper()

    renderHook(() => useAffiliateRequestsList({ search: ' Ana ', email: ' ANA@EXAMPLE.COM ', identification: ' 1-2 ' }), { wrapper })

    await waitFor(() => expect(affiliateRequestsApi.list).toHaveBeenCalledWith({
      status: undefined,
      search: 'Ana',
      email: 'ana@example.com',
      identification: '1-2',
      page: 1,
      limit: 20,
    }))
  })

  it('does not request detail without a valid ID', () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useAffiliateRequestDetail(null), { wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(affiliateRequestsApi.detail).not.toHaveBeenCalled()
  })

  it('invalidates only Affiliate Requests data after approval', async () => {
    vi.mocked(affiliateRequestsApi.approve).mockResolvedValue({ affiliate: { id: 8 }, affiliateRequest: { id: 7 } } as never)
    const { queryClient, wrapper } = createWrapper()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useAffiliateRequestMutations(), { wrapper })

    await result.current.approve.mutateAsync(7)

    expect(affiliateRequestsApi.approve).toHaveBeenCalledWith(7)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: affiliateRequestsKeys.all })
    expect(invalidate).toHaveBeenCalledTimes(1)
  })

  it('sends reject payload and invalidates Affiliate Requests data', async () => {
    vi.mocked(affiliateRequestsApi.reject).mockResolvedValue({ id: 7 } as never)
    const { queryClient, wrapper } = createWrapper()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useAffiliateRequestMutations(), { wrapper })
    const payload = { rejectionReason: 'Información incompleta' }

    await result.current.reject.mutateAsync({ id: 7, payload })

    expect(affiliateRequestsApi.reject).toHaveBeenCalledWith(7, payload)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: affiliateRequestsKeys.all })
    expect(invalidate).toHaveBeenCalledTimes(1)
  })
})
