import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assembliesApi } from '../api/assemblies.api'
import type { AssemblyPayload } from '../model/assemblies.types'

export const assembliesKeys = { all: ['assemblies'] as const, detail: (id: number) => ['assemblies', id] as const, mine: ['assemblies', 'mine'] as const, eligible: ['assemblies', 'eligible'] as const }
export const useAssemblies = () => useQuery({ queryKey: assembliesKeys.all, queryFn: assembliesApi.list })
export const useAssembly = (id: number | null) => useQuery({ queryKey: assembliesKeys.detail(id ?? 0), queryFn: () => assembliesApi.detail(id!), enabled: id !== null })
export const useMineAssemblies = () => useQuery({ queryKey: assembliesKeys.mine, queryFn: assembliesApi.mine })
export const useEligibleAffiliates = (enabled: boolean) => useQuery({ queryKey: assembliesKeys.eligible, queryFn: assembliesApi.eligible, enabled })
export function useAssemblyMutations() {
  const client = useQueryClient()
  const refresh = () => client.invalidateQueries({ queryKey: assembliesKeys.all })
  return {
    create: useMutation({ mutationFn: (payload: AssemblyPayload) => assembliesApi.create(payload), onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: number; payload: Partial<AssemblyPayload> & { status?: string } }) => assembliesApi.update(id, payload), onSuccess: refresh }),
    convocations: useMutation({ mutationFn: ({ id, affiliateIds }: { id: number; affiliateIds: number[] }) => assembliesApi.replaceConvocations(id, affiliateIds), onSuccess: refresh }),
    start: useMutation({ mutationFn: assembliesApi.start, onSuccess: refresh }),
    complete: useMutation({ mutationFn: assembliesApi.complete, onSuccess: refresh }),
    remove: useMutation({ mutationFn: assembliesApi.remove, onSuccess: refresh }),
    attendance: useMutation({ mutationFn: ({ id, entries }: { id: number; entries: { affiliateId: number; status: 'PRESENT' | 'ABSENT' }[] }) => assembliesApi.attendance(id, entries), onSuccess: refresh }),
  }
}
