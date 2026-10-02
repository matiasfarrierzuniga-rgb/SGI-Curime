import { httpClient } from '@/shared/api/httpClient'
import type { OpportunitiesFilters, OpportunitiesPage, VolunteerOpportunity, VolunteerOpportunityInput } from '../model/opportunities.types'

export const opportunitiesApi = {
  async list(filters: OpportunitiesFilters) {
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''))
    return (await httpClient.get<OpportunitiesPage>('/volunteering/opportunities', { params })).data
  },
  async get(id: number) {
    return (await httpClient.get<VolunteerOpportunity>(`/volunteering/opportunities/${id}`)).data
  },
  async create(input: Required<Pick<VolunteerOpportunityInput, 'title'>> & VolunteerOpportunityInput) {
    return (await httpClient.post<VolunteerOpportunity>('/volunteering/opportunities', input)).data
  },
  async update(id: number, input: VolunteerOpportunityInput) {
    return (await httpClient.patch<VolunteerOpportunity>(`/volunteering/opportunities/${id}`, input)).data
  },
}
