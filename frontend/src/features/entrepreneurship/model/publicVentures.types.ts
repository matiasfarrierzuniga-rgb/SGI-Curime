export type PublicVenture = {
  id: number
  name: string
  description: string | null
  offerDescription: string | null
  businessPhone: string | null
  businessEmail: string | null
  websiteUrl: string | null
  socialUrl: string | null
  locationText: string | null
}

export type PublicVenturesQuery = {
  search?: string
  page: number
  limit: number
}

export type PublicVenturesPage = {
  data: PublicVenture[]
  total: number
  page: number
  limit: number
}
