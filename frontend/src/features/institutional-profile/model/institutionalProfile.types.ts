export type InstitutionalOrganizationType = 'INTEGRAL' | 'SPECIFIC'

export interface InstitutionalProfile {
  id: 1
  legalName: string | null
  legalIdentification: string | null
  dinadecoRegistrationCode: string | null
  dinadecoRegion: string | null
  organizationType: InstitutionalOrganizationType | null
  province: string | null
  canton: string | null
  district: string | null
  locality: string | null
  correspondenceAddress: string | null
  phone: string | null
  telefax: string | null
  email: string | null
  createdAt: string
  updatedAt: string
}

export type UpdateInstitutionalProfileInput = Partial<Omit<InstitutionalProfile, 'id' | 'createdAt' | 'updatedAt'>>
