import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { financialApi } from '../api/financial.api'
import type { FinancialChargeListFilters, RecordPaymentInput } from '../model/financial.types'

export const financialKeys = {
  all: ['financial'] as const,
  charges: () => [...financialKeys.all, 'charges'] as const,
  chargeList: (filters: FinancialChargeListFilters) => [...financialKeys.charges(), 'list', filters] as const,
  chargeDetail: (id: number) => [...financialKeys.charges(), 'detail', id] as const,
}
export function useFinancialChargesList(filters: FinancialChargeListFilters) { return useQuery({ queryKey: financialKeys.chargeList(filters), queryFn: () => financialApi.listCharges(filters) }) }
export function useFinancialChargeDetail(id: number | null) { return useQuery({ queryKey: financialKeys.chargeDetail(id ?? 0), queryFn: () => financialApi.getCharge(id!), enabled: id !== null }) }
export function useRecordPayment() {
  const queryClient = useQueryClient()
  const refresh = (id: number) => Promise.all([
    queryClient.invalidateQueries({ queryKey: [...financialKeys.charges(), 'list'] }),
    queryClient.invalidateQueries({ queryKey: financialKeys.chargeDetail(id) }),
  ])
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RecordPaymentInput }) => financialApi.recordPayment(id, payload),
    onSuccess: (_, { id }) => refresh(id),
    onError: (error, { id }) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) return refresh(id)
    },
  })
}
