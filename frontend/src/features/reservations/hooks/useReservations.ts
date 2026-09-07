import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { financialKeys } from '@/features/financial'
import { reservationsApi } from '../api/reservations.api'
import type { CreateReservationRequest, ReservationFilters } from '../model/reservations.types'

export const reservationsKeys = { all: ['reservations'] as const, list: (filters: ReservationFilters) => [...reservationsKeys.all, 'list', filters] as const, detail: (id: number) => [...reservationsKeys.all, 'detail', id] as const, resources: () => [...reservationsKeys.all, 'resources'] as const, availability: (resourceId: number, startAt: string, endAt: string) => [...reservationsKeys.all, 'availability', resourceId, startAt, endAt] as const }
export function useReservableResources() { return useQuery({ queryKey: reservationsKeys.resources(), queryFn: reservationsApi.resources }) }
export function useReservationAvailability(input: Pick<CreateReservationRequest, 'resourceId' | 'startAt' | 'endAt'> | null) { return useQuery({ queryKey: reservationsKeys.availability(input?.resourceId ?? 0, input?.startAt ?? '', input?.endAt ?? ''), queryFn: () => reservationsApi.availability(input!), enabled: false }) }
export function useCreateReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reservationsApi.create,
    onSuccess: (_, payload) => Promise.all([
      queryClient.invalidateQueries({ queryKey: [...reservationsKeys.all, 'list'] }),
      queryClient.invalidateQueries({ queryKey: [...reservationsKeys.all, 'availability', payload.resourceId] }),
    ]),
  })
}
export function useReservationsList(filters: ReservationFilters, enabled = true) { return useQuery({ queryKey: reservationsKeys.list(filters), queryFn: () => reservationsApi.list(filters), enabled }) }
export function useReservationDetail(id: number | null) { return useQuery({ queryKey: reservationsKeys.detail(id ?? 0), queryFn: () => reservationsApi.detail(id!), enabled: id !== null }) }
export function useReservationMutations() {
  const queryClient = useQueryClient()
  const invalidateReservation = (id: number, resourceId: number) => Promise.all([
    queryClient.invalidateQueries({ queryKey: [...reservationsKeys.all, 'list'] }),
    queryClient.invalidateQueries({ queryKey: reservationsKeys.detail(id) }),
    queryClient.invalidateQueries({ queryKey: [...reservationsKeys.all, 'availability', resourceId] }),
  ])
  const invalidateFinancial = () => queryClient.invalidateQueries({ queryKey: financialKeys.charges() })
  return {
    approve: useMutation({ mutationFn: reservationsApi.approve, onSuccess: (reservation) => Promise.all([invalidateReservation(reservation.id, reservation.resourceId), invalidateFinancial()]) }),
    reject: useMutation({ mutationFn: ({ id, rejectionReason }: { id: number; rejectionReason: string }) => reservationsApi.reject(id, rejectionReason), onSuccess: (reservation) => invalidateReservation(reservation.id, reservation.resourceId) }),
    cancel: useMutation({ mutationFn: reservationsApi.cancel, onSuccess: (reservation) => Promise.all([invalidateReservation(reservation.id, reservation.resourceId), invalidateFinancial()]) }),
  }
}
