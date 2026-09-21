import { httpClient } from '@/shared/api/httpClient'
import type { InstitutionalProfile, UpdateInstitutionalProfileInput } from '../model/institutionalProfile.types'

export const institutionalProfileApi = {
  async get() { return (await httpClient.get<InstitutionalProfile>('/institutional-profile')).data },
  async update(input: UpdateInstitutionalProfileInput) { return (await httpClient.patch<InstitutionalProfile>('/institutional-profile', input)).data },
}
