import { httpClient } from '@/shared/api/httpClient'
import type { AdminEvent, EventPayload, PublicEvent } from '../model/events.types'

export const eventsApi = {
  async listPublic() {
    return (await httpClient.get<PublicEvent[]>('/public/events')).data
  },
  async getPublic(publicId: string) {
    return (await httpClient.get<PublicEvent>(`/public/events/${publicId}`)).data
  },
  async listAdmin() {
    return (await httpClient.get<AdminEvent[]>('/events')).data
  },
  async create(payload: EventPayload) {
    return (await httpClient.post<AdminEvent>('/events', payload)).data
  },
  async update(id: number, payload: EventPayload) {
    return (await httpClient.patch<AdminEvent>(`/events/${id}`, payload)).data
  },
  async publish(id: number) {
    return (await httpClient.patch<AdminEvent>(`/events/${id}/publish`)).data
  },
  async submitForReview(id: number) {
    return (await httpClient.patch<AdminEvent>(`/events/${id}/review`)).data
  },
  async returnToDraft(id: number) {
    return (await httpClient.patch<AdminEvent>(`/events/${id}/draft`)).data
  },
  async archive(id: number) {
    return (await httpClient.patch<AdminEvent>(`/events/${id}/archive`)).data
  },
}
