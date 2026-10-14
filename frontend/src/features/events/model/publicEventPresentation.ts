import type { EventStatus, PublicEvent } from './events.types'

export type PublicEventPresentation = {
  label: string
  isPast: boolean
  backendStatus: EventStatus
}

export function getPublicEventPresentation(event: Pick<PublicEvent, 'status' | 'startAt' | 'endAt'>, now = Date.now()): PublicEventPresentation {
  if (event.status === 'CANCELLED') return { label: 'Cancelado', isPast: false, backendStatus: event.status }
  if (event.status === 'COMPLETED') return { label: 'Actividad realizada', isPast: true, backendStatus: event.status }
  const end = new Date(event.endAt ?? event.startAt).getTime()
  return end < now
    ? { label: 'Fecha transcurrida', isPast: true, backendStatus: event.status }
    : { label: 'Programado', isPast: false, backendStatus: event.status }
}
