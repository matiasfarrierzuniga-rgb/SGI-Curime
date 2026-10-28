import { httpClient } from '@/shared/api/httpClient'
import type { PublicOpportunitiesPage, PublicOpportunitiesQuery, PublicVolunteerOpportunity, VolunteerApplicationInput } from '../model/publicOpportunities.types'

export const publicOpportunitiesApi = {
  async list(query: PublicOpportunitiesQuery) {
    const params = Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== ''))
    return (await httpClient.get<PublicOpportunitiesPage>('/public/volunteering/opportunities', { params })).data
  },
  async get(id: number) {
    return (await httpClient.get<PublicVolunteerOpportunity>(`/public/volunteering/opportunities/${id}`)).data
  },
  async apply(id: number, input: VolunteerApplicationInput) {
    return (await httpClient.post<{ received: true }>(`/public/volunteering/opportunities/${id}/applications`, input)).data
  },
}
