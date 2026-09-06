import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { reservationsApi } from '../api/reservations.api'
import type { CreateReservationRequest, ReservationFilters } from '../model/reservations.types'

export const reservationsKeys = { all: ['reservations'] as const, list: (filters: ReservationFilters) => [...reservationsKeys.all, 'list', filters] as const, detail: (id: number) => [...reservationsKeys.all, 'detail', id] as const, resources: () => [...reservationsKeys.all, 'resources'] as const, availability: (resourceId: number, startAt: string, endAt: string) => [...reservationsKeys.all, 'availability', resourceId, startAt, endAt] as const }
export function useReservableResources() { return useQuery({ queryKey: reservationsKeys.resources(), queryFn: reservationsApi.resources }) }
export function useReservationAvailability(input: Pick<CreateReservationRequest, 'resourceId' | 'startAt' | 'endAt'> | null) { return useQuery({ queryKey: reservationsKeys.availability(input?.resourceId ?? 0, input?.startAt ?? '', input?.endAt ?? ''), queryFn: () => reservationsApi.availability(input!), enabled: false }) }
export function useCreateReservation() { return useMutation({ mutationFn: reservationsApi.create }) }
export function useReservationsList(filters: ReservationFilters) { return useQuery({ queryKey: reservationsKeys.list(filters), queryFn: () => reservationsApi.list(filters) }) }
export function useReservationDetail(id: number | null) { return useQuery({ queryKey: reservationsKeys.detail(id ?? 0), queryFn: () => reservationsApi.detail(id!), enabled: id !== null }) }
export function useReservationMutations() {
  const queryClient = useQueryClient()
  const invalidate = (id: number) => Promise.all([
    queryClient.invalidateQueries({ queryKey: [...reservationsKeys.all, 'list'] }),
    queryClient.invalidateQueries({ queryKey: reservationsKeys.detail(id) }),
  ])
  return {
    approve: useMutation({ mutationFn: reservationsApi.approve, onSuccess: (_, id) => invalidate(id) }),
    reject: useMutation({ mutationFn: ({ id, rejectionReason }: { id: number; rejectionReason: string }) => reservationsApi.reject(id, rejectionReason), onSuccess: (_, variables) => invalidate(variables.id) }),
    cancel: useMutation({ mutationFn: reservationsApi.cancel, onSuccess: (_, id) => invalidate(id) }),
  }
}
