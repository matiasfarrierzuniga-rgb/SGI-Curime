import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { financialMovementKeys } from '@/features/financial'
import { donationsApi, normalizeDonationListFilters } from '../api/donations.api'
import type {
  CancelDonationInput,
  CreateDonationInput,
  DonationListFilters,
  UpdateDonationInput,
} from '../model/donations.types'

export const donationsKeys = {
  all: ['donations'] as const,
  lists: () => [...donationsKeys.all, 'list'] as const,
  list: (filters: DonationListFilters = {}) =>
    [...donationsKeys.lists(), normalizeDonationListFilters(filters)] as const,
  details: () => [...donationsKeys.all, 'detail'] as const,
  detail: (id: number) => [...donationsKeys.details(), id] as const,
}

export function useDonationsList(filters: DonationListFilters = {}) {
  const normalizedFilters = normalizeDonationListFilters(filters)
  return useQuery({
    queryKey: donationsKeys.list(normalizedFilters),
    queryFn: () => donationsApi.getDonations(normalizedFilters),
  })
}

export function useDonationDetail(id: number | null | undefined) {
  const validId = typeof id === 'number' && id > 0
  return useQuery({
    queryKey: donationsKeys.detail(validId ? id : 0),
    queryFn: () => donationsApi.getDonation(id!),
    enabled: validId,
  })
}

function useDonationInvalidation() {
  const queryClient = useQueryClient()
  const invalidateLists = () =>
    queryClient.invalidateQueries({ queryKey: donationsKeys.lists() })
  const invalidateFinancialMovements = () =>
    queryClient.invalidateQueries({ queryKey: financialMovementKeys.all() })
  const invalidateDonationListsAndFinancialMovements = () =>
    Promise.all([invalidateLists(), invalidateFinancialMovements()])
  const invalidateDonation = (id: number) =>
    Promise.all([
      invalidateLists(),
      queryClient.invalidateQueries({ queryKey: donationsKeys.detail(id) }),
      invalidateFinancialMovements(),
    ])

  return { invalidateDonationListsAndFinancialMovements, invalidateDonation }
}

export function useCreateDonation() {
  const { invalidateDonationListsAndFinancialMovements } = useDonationInvalidation()
  return useMutation({
    mutationFn: (input: CreateDonationInput) => donationsApi.createDonation(input),
    onSuccess: invalidateDonationListsAndFinancialMovements,
  })
}

export function useUpdateDonation() {
  const { invalidateDonation } = useDonationInvalidation()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateDonationInput }) =>
      donationsApi.updateDonation(id, input),
    onSuccess: (_, { id }) => invalidateDonation(id),
  })
}

export function useCancelDonation() {
  const { invalidateDonation } = useDonationInvalidation()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CancelDonationInput }) =>
      donationsApi.cancelDonation(id, input),
    onSuccess: (_, { id }) => invalidateDonation(id),
  })
}

export function useDeleteDonation() {
  const { invalidateDonation } = useDonationInvalidation()
  return useMutation({
    mutationFn: (id: number) => donationsApi.deleteDonation(id),
    onSuccess: (_, id) => invalidateDonation(id),
  })
}
