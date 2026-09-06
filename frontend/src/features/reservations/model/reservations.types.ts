export type ReservableResource = { id: number; name: string; description: string | null; location: string | null; capacity: number | null; status: 'ACTIVE' | 'INACTIVE' }
export type CreateReservationRequest = { resourceId: number; startAt: string; endAt: string; purpose: string; estimatedAttendees?: number; notes?: string }
export type ReservationAvailabilityResponse = { available: boolean }

export type ReservationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'CONFIRMED' | 'COMPLETED'
export type ReservationFilters = { status?: ReservationStatus; resourceId?: number; from?: string; to?: string; page?: number; limit?: number }
export type ReservationPerson = { id: number; fullName: string; email: string }
export type ReservationResourceSummary = { id: number; name: string; location: string | null }
export type ReservationEvent = { id: number; title: string; startAt: string; endAt: string | null }
export type AdminReservation = {
  id: number
  resourceId: number
  resource: ReservationResourceSummary
  requesterUserId: number
  requester: ReservationPerson
  eventId: number | null
  event: ReservationEvent | null
  startAt: string
  endAt: string
  purpose: string
  estimatedAttendees: number | null
  notes: string | null
  status: ReservationStatus
  approvedAt: string | null
  approvedById: number | null
  approvedBy: ReservationPerson | null
  rejectionReason: string | null
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
}
export type PaginatedReservations = { data: AdminReservation[]; total: number; page: number; limit: number }
