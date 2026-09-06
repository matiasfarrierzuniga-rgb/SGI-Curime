import { httpClient } from '@/shared/api/httpClient'
import type { CreateReservationRequest, ReservableResource, ReservationAvailabilityResponse } from '../model/reservations.types'

export const reservationsApi = {
  async resources() { return (await httpClient.get<ReservableResource[]>('/reservable-resources')).data },
  async availability(input: Pick<CreateReservationRequest, 'resourceId' | 'startAt' | 'endAt'>) { return (await httpClient.get<ReservationAvailabilityResponse>('/reservations/availability', { params: input })).data },
  async create(payload: CreateReservationRequest) { return (await httpClient.post('/reservations', payload)).data },
}
