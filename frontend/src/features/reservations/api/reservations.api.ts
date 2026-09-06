import { httpClient } from '@/shared/api/httpClient'
import type { AdminReservation, CreateReservationRequest, PaginatedReservations, ReservableResource, ReservationAvailabilityResponse, ReservationFilters } from '../model/reservations.types'

export const reservationsApi = {
  async resources() { return (await httpClient.get<ReservableResource[]>('/reservable-resources')).data },
  async availability(input: Pick<CreateReservationRequest, 'resourceId' | 'startAt' | 'endAt'>) { return (await httpClient.get<ReservationAvailabilityResponse>('/reservations/availability', { params: input })).data },
  async create(payload: CreateReservationRequest) { return (await httpClient.post('/reservations', payload)).data },
  async list(filters: ReservationFilters) { return (await httpClient.get<PaginatedReservations>('/reservations', { params: filters })).data },
  async detail(id: number) { return (await httpClient.get<AdminReservation>(`/reservations/${id}`)).data },
  async approve(id: number) { return (await httpClient.patch<AdminReservation>(`/reservations/${id}/approve`)).data },
  async reject(id: number, rejectionReason: string) { return (await httpClient.patch<AdminReservation>(`/reservations/${id}/reject`, { rejectionReason })).data },
  async cancel(id: number) { return (await httpClient.patch<AdminReservation>(`/reservations/${id}/cancel`)).data },
}
