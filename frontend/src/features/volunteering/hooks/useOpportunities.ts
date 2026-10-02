import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { opportunitiesApi } from '../api/opportunities.api'
import type { OpportunitiesFilters, VolunteerOpportunityInput } from '../model/opportunities.types'

export const opportunitiesKeys = {
  all: ['volunteering-opportunities'] as const,
  list: (filters: OpportunitiesFilters) => [...opportunitiesKeys.all, 'list', filters] as const,
  detail: (id: number) => [...opportunitiesKeys.all, 'detail', id] as const,
}

export function useOpportunities(filters: OpportunitiesFilters) {
  return useQuery({ queryKey: opportunitiesKeys.list(filters), queryFn: () => opportunitiesApi.list(filters) })
}

export function useOpportunity(id: number | null) {
  return useQuery({ queryKey: opportunitiesKeys.detail(id ?? 0), queryFn: () => opportunitiesApi.get(id!), enabled: id !== null })
}

export function useOpportunityMutations() {
  const client = useQueryClient()
  const invalidate = () => client.invalidateQueries({ queryKey: opportunitiesKeys.all })
  return {
    create: useMutation({ mutationFn: (input: Required<Pick<VolunteerOpportunityInput, 'title'>> & VolunteerOpportunityInput) => opportunitiesApi.create(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, input }: { id: number; input: VolunteerOpportunityInput }) => opportunitiesApi.update(id, input), onSuccess: invalidate }),
  }
}
