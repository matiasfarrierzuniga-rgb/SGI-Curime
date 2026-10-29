import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { publicOpportunitiesApi } from '../api/publicOpportunities.api'
import type { PublicOpportunitiesQuery, VolunteerApplicationInput } from '../model/publicOpportunities.types'

export const publicOpportunitiesKeys = {
  all: ['public-volunteer-opportunities'] as const,
  list: (query: PublicOpportunitiesQuery) => [...publicOpportunitiesKeys.all, 'list', query] as const,
  detail: (id: number) => [...publicOpportunitiesKeys.all, 'detail', id] as const,
}

export function usePublicOpportunities(query: PublicOpportunitiesQuery) {
  return useQuery({ queryKey: publicOpportunitiesKeys.list(query), queryFn: () => publicOpportunitiesApi.list(query) })
}

export function usePublicOpportunity(id: number | null) {
  return useQuery({ queryKey: publicOpportunitiesKeys.detail(id ?? 0), queryFn: () => publicOpportunitiesApi.get(id!), enabled: id !== null })
}

export function useSubmitVolunteerApplication(id: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: VolunteerApplicationInput) => publicOpportunitiesApi.apply(id, input),
    onSuccess: () => client.invalidateQueries({ queryKey: publicOpportunitiesKeys.detail(id) }),
  })
}
