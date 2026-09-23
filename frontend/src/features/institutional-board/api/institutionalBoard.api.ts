import { httpClient } from '@/shared/api/httpClient'
import type { BoardAppointment, BoardPosition, BoardTerm, PersonCandidate } from '../model/institutionalBoard.types'
export type AppointmentInput = { personId: number; position: BoardPosition; seatNumber: number | null; startsOn: string | null; endsOn: string | null }
export type UpdateAppointmentInput = Omit<AppointmentInput, 'personId'>
export const institutionalBoardApi = {
  async terms() { return (await httpClient.get<BoardTerm[]>('/institutional-board/terms')).data },
  async createTerm(input: { startsOn: string; endsOn: string }) { return (await httpClient.post<BoardTerm>('/institutional-board/terms', input)).data },
  async candidates(query: string) { return (await httpClient.get<PersonCandidate[]>('/institutional-board/person-candidates', { params: { query } })).data },
  async createAppointment(termId: number, input: AppointmentInput) { return (await httpClient.post<BoardAppointment>(`/institutional-board/terms/${termId}/appointments`, input)).data },
  async updateAppointment(id: number, input: UpdateAppointmentInput) { return (await httpClient.patch<BoardAppointment>(`/institutional-board/appointments/${id}`, input)).data },
}
