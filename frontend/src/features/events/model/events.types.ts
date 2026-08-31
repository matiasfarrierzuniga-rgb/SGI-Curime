export type EventStatus = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED'
export type PublicationStatus = 'INTERNAL' | 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED'

export type PublicEvent = {
  publicId: string
  title: string
  summary: string
  description: string | null
  startAt: string
  endAt: string | null
  location: string | null
  status: EventStatus
}

export type AdminEvent = PublicEvent & {
  id: number
  publicationStatus: PublicationStatus
  createdAt: string
  updatedAt: string
}

export type EventPayload = {
  title: string
  summary: string
  description?: string
  startAt: string
  endAt?: string
  location?: string
  status?: EventStatus
}
