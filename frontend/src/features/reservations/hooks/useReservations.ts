import { useMutation, useQuery } from '@tanstack/react-query'
import { reservationsApi } from '../api/reservations.api'
import type { CreateReservationRequest } from '../model/reservations.types'

export const reservationsKeys = { all: ['reservations'] as const, resources: () => [...reservationsKeys.all, 'resources'] as const, availability: (resourceId: number, startAt: string, endAt: string) => [...reservationsKeys.all, 'availability', resourceId, startAt, endAt] as const }
export function useReservableResources() { return useQuery({ queryKey: reservationsKeys.resources(), queryFn: reservationsApi.resources }) }
export function useReservationAvailability(input: Pick<CreateReservationRequest, 'resourceId' | 'startAt' | 'endAt'> | null) { return useQuery({ queryKey: reservationsKeys.availability(input?.resourceId ?? 0, input?.startAt ?? '', input?.endAt ?? ''), queryFn: () => reservationsApi.availability(input!), enabled: false }) }
export function useCreateReservation() { return useMutation({ mutationFn: reservationsApi.create }) }
