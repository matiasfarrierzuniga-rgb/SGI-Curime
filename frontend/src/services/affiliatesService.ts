import { httpClient } from '../api/httpClient'
import type { AffiliateListResponse, AffiliateOption, AffiliateQuery } from '../types/inventory'

export const affiliatesService = {
  async list(params: AffiliateQuery) {
    return (await httpClient.get<AffiliateListResponse>('/affiliates', { params })).data
  },
}

export type { AffiliateOption }