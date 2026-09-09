import { httpClient } from '@/shared/api/httpClient'
import type {
  CancelDonationInput,
  CreateDonationInput,
  DeleteDonationResponse,
  Donation,
  DonationListFilters,
  DonationListResponse,
  UpdateDonationInput,
} from '../model/donations.types'

export function normalizeDonationListFilters(
  filters: DonationListFilters = {},
): DonationListFilters {
  return Object.fromEntries(
    Object.entries(filters).flatMap(([key, value]) => {
      if (value === undefined || value === null) return []
      if (typeof value === 'string') {
        const normalized = value.trim()
        return normalized ? [[key, normalized]] : []
      }
      return [[key, value]]
    }),
  ) as DonationListFilters
}

export const donationsApi = {
  async getDonations(filters: DonationListFilters = {}) {
    return (
      await httpClient.get<DonationListResponse>('/donations', {
        params: normalizeDonationListFilters(filters),
      })
    ).data
  },

  async getDonation(id: number) {
    return (await httpClient.get<Donation>(`/donations/${id}`)).data
  },

  async createDonation(input: CreateDonationInput) {
    return (await httpClient.post<Donation>('/donations', input)).data
  },

  async updateDonation(id: number, input: UpdateDonationInput) {
    return (await httpClient.patch<Donation>(`/donations/${id}`, input)).data
  },

  async cancelDonation(id: number, input: CancelDonationInput) {
    return (await httpClient.patch<Donation>(`/donations/${id}/cancel`, input)).data
  },

  async deleteDonation(id: number) {
    return (await httpClient.delete<DeleteDonationResponse>(`/donations/${id}`)).data
  },
}
