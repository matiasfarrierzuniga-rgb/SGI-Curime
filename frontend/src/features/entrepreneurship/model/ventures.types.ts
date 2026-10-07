export type VentureStatus = 'ACTIVE' | 'SUSPENDED' | 'CLOSED'
export type VenturePublicationStatus = 'UNPUBLISHED' | 'PUBLISHED'

export type Venture = {
  id: number
  name: string
  description: string | null
  offerDescription: string | null
  businessPhone: string | null
  businessEmail: string | null
  websiteUrl: string | null
  socialUrl: string | null
  locationText: string | null
  status: VentureStatus
  publicationStatus: VenturePublicationStatus
  incorporatedAt: string
  createdAt: string
  updatedAt: string
  associations: VentureAssociation[]
}

export type VentureAssociation = {
  id: number
  startedAt: string
  endedAt: string | null
  person: {
    id: number
    firstName: string
    firstSurname: string
    secondSurname: string | null
    identification: string
    identificationType: string
  }
}

export type VenturesFilters = {
  search?: string
  status?: VentureStatus
  publicationStatus?: VenturePublicationStatus
  location?: string
  dateFrom?: string
  dateTo?: string
  page: number
  limit: number
}

export type VenturesPage = {
  data: Venture[]
  total: number
  page: number
  limit: number
  byStatus: { status: VentureStatus; count: number }[]
  byLocation: { location: string | null; count: number }[]
}

export type VentureInput = {
  name?: string
  description?: string
  offerDescription?: string
  businessPhone?: string
  businessEmail?: string
  websiteUrl?: string
  socialUrl?: string
  locationText?: string
  incorporatedAt?: string
}
