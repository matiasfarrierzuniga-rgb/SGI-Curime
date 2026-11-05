export type PublicVolunteerOpportunity = {
  id: number
  title: string
  description: string | null
  location: string | null
  capacity: number | null
  applicationDeadline: string | null
  acceptingApplications?: boolean
}

export type VolunteerApplicationInput = {
  fullName: string
  email?: string
  phoneCountryCode?: string
  phoneNationalNumber?: string
  motivation?: string
}

export type PublicOpportunitiesQuery = { search?: string; page: number; limit: number }

export type PublicOpportunitiesPage = {
  data: PublicVolunteerOpportunity[]
  total: number
  page: number
  limit: number
}
