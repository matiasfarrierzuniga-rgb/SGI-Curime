import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { venturesApi } from '../api/ventures.api'
import type { VentureInput, VenturesFilters } from '../model/ventures.types'

export const venturesKeys = {
  all: ['ventures'] as const,
  list: (filters: VenturesFilters) => [...venturesKeys.all, 'list', filters] as const,
  detail: (id: number) => [...venturesKeys.all, 'detail', id] as const,
}

export function useVentures(filters: VenturesFilters, enabled = true) {
  return useQuery({ queryKey: venturesKeys.list(filters), queryFn: () => venturesApi.list(filters), enabled })
}

export function useVenture(id: number | null, enabled = true) {
  return useQuery({ queryKey: venturesKeys.detail(id ?? 0), queryFn: () => venturesApi.get(id!), enabled: enabled && id !== null })
}

export function useVentureMutations() {
  const client = useQueryClient()
  const invalidate = () => client.invalidateQueries({ queryKey: venturesKeys.all })
  return {
    create: useMutation({ mutationFn: (input: Required<Pick<VentureInput, 'name' | 'incorporatedAt'>> & VentureInput) => venturesApi.create(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, input }: { id: number; input: VentureInput }) => venturesApi.update(id, input), onSuccess: invalidate }),
    publish: useMutation({ mutationFn: venturesApi.publish, onSuccess: invalidate }),
    unpublish: useMutation({ mutationFn: venturesApi.unpublish, onSuccess: invalidate }),
  }
}
