import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { affiliatesService } from '../api/affiliates.api'
import type { AffiliateListFilters, AffiliateUpdate } from '../model/affiliates.types'

function normalizeFilters(filters: AffiliateListFilters): Required<Pick<AffiliateListFilters, 'page' | 'limit'>> & Omit<AffiliateListFilters, 'page' | 'limit'> {
  return {
    search: filters.search?.trim() || undefined,
    name: filters.name?.trim() || undefined,
    identification: filters.identification?.trim() || undefined,
    status: filters.status,
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
  }
}

export const affiliatesKeys = {
  all: ['affiliates'] as const,
  list: (filters: AffiliateListFilters) => [...affiliatesKeys.all, 'list', normalizeFilters(filters)] as const,
  detail: (id: number) => [...affiliatesKeys.all, 'detail', id] as const,
}

export function useAffiliatesList(filters: AffiliateListFilters) {
  const normalizedFilters = normalizeFilters(filters)
  return useQuery({
    queryKey: affiliatesKeys.list(normalizedFilters),
    queryFn: () => affiliatesService.list(normalizedFilters),
  })
}

export function useAffiliateDetail(id: number | null) {
  const enabled = Number.isInteger(id) && id! > 0

  return useQuery({
    queryKey: affiliatesKeys.detail(id ?? 0),
    queryFn: () => affiliatesService.detail(id!),
    enabled,
  })
}

export function useAffiliateMutations() {
  const queryClient = useQueryClient()
  const invalidate = async (id: number) => {
    await queryClient.invalidateQueries({ queryKey: affiliatesKeys.all })
    await queryClient.invalidateQueries({ queryKey: affiliatesKeys.detail(id) })
  }

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AffiliateUpdate }) => affiliatesService.update(id, payload),
    onSuccess: (_data, { id }) => invalidate(id),
  })
  const activate = useMutation({
    mutationFn: (id: number) => affiliatesService.activate(id),
    onSuccess: (_data, id) => invalidate(id),
  })
  const deactivate = useMutation({
    mutationFn: (id: number) => affiliatesService.deactivate(id),
    onSuccess: (_data, id) => invalidate(id),
  })

  return { update, activate, deactivate }
}
