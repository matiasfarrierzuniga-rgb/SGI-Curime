export type ReservableResource = { id: number; name: string; description: string | null; location: string | null; capacity: number | null; status: 'ACTIVE' | 'INACTIVE' }
export type CreateReservationRequest = { resourceId: number; startAt: string; endAt: string; purpose: string; estimatedAttendees?: number; notes?: string }
export type ReservationAvailabilityResponse = { available: boolean }
