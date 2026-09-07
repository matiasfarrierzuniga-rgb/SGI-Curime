import type { ReservationStatus } from '../model/reservations.types'

export function reservationStatusLabel(status: ReservationStatus) {
  return {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
    CANCELLED: 'Cancelada',
    CONFIRMED: 'Confirmada',
    COMPLETED: 'Completada',
  }[status]
}

export function reservationStatusVariant(status: ReservationStatus) {
  return {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    CANCELLED: 'neutral',
    CONFIRMED: 'info',
    COMPLETED: 'neutral',
  }[status] as 'warning' | 'success' | 'danger' | 'neutral' | 'info'
}

export function formatReservationDate(value: string | null) {
  if (!value) return 'Sin registro'
  return new Intl.DateTimeFormat('es-CR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Costa_Rica',
  }).format(new Date(value))
}
