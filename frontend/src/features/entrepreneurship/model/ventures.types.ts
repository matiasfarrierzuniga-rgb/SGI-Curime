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
  status: VentureStatus | string
  publicationStatus: VenturePublicationStatus | string
  incorporatedAt: string
  createdAt: string
  updatedAt: string
}

export type VenturesFilters = {
  search?: string
  status?: VentureStatus
  publicationStatus?: VenturePublicationStatus
  page: number
  limit: number
}

export type VenturesPage = {
  data: Venture[]
  total: number
  page: number
  limit: number
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
