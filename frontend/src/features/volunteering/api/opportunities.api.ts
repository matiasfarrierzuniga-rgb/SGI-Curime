import { httpClient } from '@/shared/api/httpClient'
import type { OpportunitiesFilters, OpportunitiesPage, VolunteerApplication, VolunteerOpportunity, VolunteerOpportunityInput, VolunteerSession } from '../model/opportunities.types'

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
  async sessions(id: number) {
    return (await httpClient.get<VolunteerSession[]>(`/volunteering/opportunities/${id}/sessions`)).data
  },
  async addSession(id: number, input: { title?: string; startAt: string; endAt: string }) {
    return (await httpClient.post<VolunteerSession>(`/volunteering/opportunities/${id}/sessions`, input)).data
  },
  async publish(id: number) {
    return (await httpClient.patch<VolunteerOpportunity>(`/volunteering/opportunities/${id}/publish`)).data
  },
  async close(id: number) {
    return (await httpClient.patch<VolunteerOpportunity>(`/volunteering/opportunities/${id}/close`)).data
  },
  async applications(id: number) {
    return (await httpClient.get<VolunteerApplication[]>(`/volunteering/opportunities/${id}/applications`)).data
  },
  async approveApplication(id: number, input: { personId?: number; createPerson?: boolean }) {
    return (await httpClient.patch<VolunteerApplication>(`/volunteering/applications/${id}/approve`, input)).data
  },
  async rejectApplication(id: number, rejectionReason: string) {
    return (await httpClient.patch<VolunteerApplication>(`/volunteering/applications/${id}/reject`, { rejectionReason })).data
  },
}
