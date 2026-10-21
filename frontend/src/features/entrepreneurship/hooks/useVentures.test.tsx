import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { venturesApi } from '../api/ventures.api'
import { venturesKeys, useVentureMutations } from './useVentures'

vi.mock('../api/ventures.api', () => ({ venturesApi: { publish: vi.fn(), unpublish: vi.fn() } }))

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  return { queryClient, wrapper }
}

describe('venture publication mutations', () => {
  it.each([
    ['publish', (mutations: ReturnType<typeof useVentureMutations>) => mutations.publish.mutateAsync(7)],
    ['unpublish', (mutations: ReturnType<typeof useVentureMutations>) => mutations.unpublish.mutateAsync(7)],
  ])('invalidates directory, detail, and dashboard queries after %s', async (method, runMutation) => {
    vi.mocked(venturesApi[method]).mockResolvedValue({ id: 7 } as never)
    const { queryClient, wrapper } = createWrapper()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useVentureMutations(), { wrapper })

    await runMutation(result.current)

    expect(invalidate).toHaveBeenCalledWith({ queryKey: venturesKeys.all })
  })
})
