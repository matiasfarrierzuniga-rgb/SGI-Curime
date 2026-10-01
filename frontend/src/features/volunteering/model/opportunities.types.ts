export type OpportunityStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'COMPLETED' | 'CANCELLED'

export type VolunteerOpportunity = {
  id: number
  title: string
  description: string | null
  location: string | null
  capacity: number | null
  applicationDeadline: string | null
  status: OpportunityStatus
  createdByUserId: number
  createdAt: string
  updatedAt: string
}

export type OpportunitiesFilters = {
  search?: string
  status?: OpportunityStatus
  page: number
  limit: number
}

export type OpportunitiesPage = {
  data: VolunteerOpportunity[]
  total: number
  page: number
  limit: number
}

export type VolunteerOpportunityInput = {
  title?: string
  description?: string
  location?: string
  capacity?: number
  applicationDeadline?: string
}
