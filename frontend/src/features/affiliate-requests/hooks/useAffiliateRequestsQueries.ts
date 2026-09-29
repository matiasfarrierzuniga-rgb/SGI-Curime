import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { affiliateRequestsApi } from '../api/affiliateRequests.api'
import type { AffiliateRequestListFilters, RejectAffiliateRequestPayload } from '../model/affiliateRequests.types'

function normalizeFilters(filters: AffiliateRequestListFilters): Required<Pick<AffiliateRequestListFilters, 'page' | 'limit'>> & Omit<AffiliateRequestListFilters, 'page' | 'limit'> {
  return {
    status: filters.status,
    search: filters.search?.trim() || undefined,
    email: filters.email?.trim().toLowerCase() || undefined,
    identification: filters.identification?.trim() || undefined,
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
  }
}

function normalizeQueryKeyFilters(filters: AffiliateRequestListFilters) {
  const normalized = normalizeFilters(filters)

  return {
    ...normalized,
    // The backend search is case-insensitive, so cache identity must be too.
    search: normalized.search?.toLowerCase(),
  }
}

export const affiliateRequestsKeys = {
  all: ['affiliate-requests'] as const,
  list: (filters: AffiliateRequestListFilters) => [...affiliateRequestsKeys.all, 'list', normalizeQueryKeyFilters(filters)] as const,
  detail: (id: number) => [...affiliateRequestsKeys.all, 'detail', id] as const,
}

export function useAffiliateRequestsList(filters: AffiliateRequestListFilters) {
  const normalizedFilters = normalizeFilters(filters)

  return useQuery({
    queryKey: affiliateRequestsKeys.list(normalizedFilters),
    queryFn: () => affiliateRequestsApi.list(normalizedFilters),
  })
}

export function useAffiliateRequestDetail(id: number | null) {
  const enabled = Number.isInteger(id) && id! > 0

  return useQuery({
    queryKey: affiliateRequestsKeys.detail(id ?? 0),
    queryFn: () => affiliateRequestsApi.detail(id!),
    enabled,
  })
}

export function useAffiliateRequestMutations() {
  const queryClient = useQueryClient()
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: affiliateRequestsKeys.all })
  }

  const approve = useMutation({
    mutationFn: (id: number) => affiliateRequestsApi.approve(id),
    onSuccess: invalidate,
  })
  const reject = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RejectAffiliateRequestPayload }) => affiliateRequestsApi.reject(id, payload),
    onSuccess: invalidate,
  })

  return { approve, reject }
}
