import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { reservationsApi } from '../api/reservations.api'
import { useReservationAvailability } from './useReservations'

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

afterEach(() => vi.restoreAllMocks())

describe('useReservationAvailability', () => {
  it('sends a valid availability request only when refetched', async () => {
    const availability = vi.spyOn(reservationsApi, 'availability').mockResolvedValue({ available: true })
    const input = { resourceId: 1, startAt: '2030-01-01T14:00:00.000Z', endAt: '2030-01-01T15:00:00.000Z' }
    const { result } = renderHook(() => useReservationAvailability(input), { wrapper })

    expect(availability).not.toHaveBeenCalled()
    const response = await result.current.refetch()
    await waitFor(() => expect(availability).toHaveBeenCalledWith(input))
    expect(response.data).toEqual({ available: true })
  })

  it('does not construct a request for incomplete input', () => {
    const availability = vi.spyOn(reservationsApi, 'availability')
    const { result } = renderHook(() => useReservationAvailability(null), { wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(availability).not.toHaveBeenCalled()
  })
})
