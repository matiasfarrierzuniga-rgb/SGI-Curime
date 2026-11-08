import { httpClient } from '@/shared/api/httpClient'

export type IdentityLookupResult =
  | { found: true; normalizedIdentification: string; identificationType: 'NATIONAL' | 'DIMEX'; sourceIdentificationType: string; nombreCompleto: string; suggestedNames: { firstName: string; firstSurname: string; secondSurname: string } }
  | { found: false; normalizedIdentification: string; message: string }

export const identityLookupService = {
  async lookup(identification: string) {
    return (await httpClient.get<IdentityLookupResult>(`/identity/lookup/${encodeURIComponent(identification)}`)).data
  },
}
