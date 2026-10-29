export type OpportunityStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'COMPLETED' | 'CANCELLED'

export type VolunteerOpportunity = {
  id: number
  title: string
  description: string | null
  location: string | null
  capacity: number | null
  applicationDeadline: string | null
  status: OpportunityStatus
  publishedAt?: string | null
  closedAt?: string | null
  createdByUserId: number
  createdAt: string
  updatedAt: string
}

export type VolunteerSession = { id: number; title: string | null; startAt: string; endAt: string; status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' }

export type VolunteerApplication = {
  id: number
  opportunityId: number
  personId: number | null
  submittedFullName: string
  submittedEmail: string | null
  submittedPhone: string | null
  motivation: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
  requestedAt: string
  reviewedAt: string | null
  rejectionReason: string | null
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
