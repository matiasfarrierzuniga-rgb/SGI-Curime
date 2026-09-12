import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  donationsApi,
  donationsKeys,
  useCancelDonation,
  useCreateDonation,
  useDeleteDonation,
  useUpdateDonation,
  type Donation,
  type DonationListResponse,
} from '../index'
import { financialMovementKeys } from '@/features/financial'

const donation: Donation = {
  id: 8,
  donorName: null,
  donorIdentification: null,
  amount: '25000.00',
  currency: 'CRC',
  method: 'CASH',
  reference: null,
  description: null,
  receivedAt: '2026-09-09T16:00:00.000Z',
  status: 'CONFIRMED',
  recordedById: 17,
  cancelledById: null,
  cancelledAt: null,
  cancellationReason: null,
  originalMovementId: 84,
  reversalMovementId: null,
  createdAt: '2026-09-09T16:00:00.000Z',
  updatedAt: '2026-09-09T16:00:00.000Z',
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('donations query keys', () => {
  it('keeps root key stable and separates list and detail caches', () => {
    expect(donationsKeys.all).toEqual(['donations'])
    expect(donationsKeys.list({ page: 1 })).not.toEqual(donationsKeys.list({ page: 2 }))
    expect(donationsKeys.detail(8)).not.toEqual(donationsKeys.detail(9))
    expect(donationsKeys.list({ page: 1 })).not.toEqual(donationsKeys.detail(1))
  })

  it('uses canonical money and status contracts', () => {
    const response: DonationListResponse = { data: [donation], total: 1, page: 1, limit: 20 }
    expect(typeof response.data[0].amount).toBe('string')
    expect(response.data[0].status).toBe('CONFIRMED')
    expect(response.data[0].method).toBe('CASH')
  })
})

describe('donation mutations', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('create invalidates donation lists and financial movements', async () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    vi.spyOn(donationsApi, 'createDonation').mockResolvedValue(donation)
    const { result } = renderHook(() => useCreateDonation(), { wrapper: createWrapper(queryClient) })

    await result.current.mutateAsync({ amount: donation.amount, method: donation.method, receivedAt: donation.receivedAt })

    expect(invalidate).toHaveBeenCalledWith({ queryKey: donationsKeys.lists() })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: financialMovementKeys.all() })
  })

  it.each([
    ['update', () => useUpdateDonation(), () => ({ id: 8, input: { reference: 'REC-1' } }), 'updateDonation'],
    ['cancel', () => useCancelDonation(), () => ({ id: 8, input: { cancellationReason: 'Duplicado' } }), 'cancelDonation'],
    ['delete', () => useDeleteDonation(), () => 8, 'deleteDonation'],
  ] as const)('%s invalidates donation list, detail, and financial movements', async (_name, useHook, mutationInput, apiMethod) => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const resultValue = apiMethod === 'deleteDonation' ? { deleted: true as const, id: 8 } : donation
    vi.spyOn(donationsApi, apiMethod).mockResolvedValue(resultValue as never)
    const { result } = renderHook(() => useHook(), { wrapper: createWrapper(queryClient) })

    result.current.mutate(mutationInput() as never)
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: donationsKeys.detail(8) }))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: donationsKeys.lists() })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: financialMovementKeys.all() })
  })
})
