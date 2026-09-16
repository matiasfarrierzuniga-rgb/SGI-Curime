import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { financialApi } from '../api/financial.api'
import type { CreateFinancialMovementInput, FinancialChargeListFilters, FinancialMovementListFilters, RecordPaymentInput } from '../model/financial.types'

export const financialKeys = {
  all: ['financial'] as const,
  charges: () => [...financialKeys.all, 'charges'] as const,
  chargeList: (filters: FinancialChargeListFilters) => [...financialKeys.charges(), 'list', filters] as const,
  chargeDetail: (id: number) => [...financialKeys.charges(), 'detail', id] as const,
  movements: () => [...financialKeys.all, 'movements'] as const,
  movementList: (filters: FinancialMovementListFilters) => [...financialKeys.movements(), 'list', filters] as const,
  movementDetail: (id: number) => [...financialKeys.movements(), 'detail', id] as const,
  movementSummary: (filters: Pick<FinancialMovementListFilters, 'dateFrom' | 'dateTo'>) => [...financialKeys.movements(), 'summary', filters] as const,
  dinadecoAnnual: (year: number) => [...financialKeys.all, 'dinadeco', 'annual', year] as const,
}

export const financialMovementKeys = {
  all: () => financialKeys.movements(),
}

export function useFinancialChargesList(filters: FinancialChargeListFilters) { return useQuery({ queryKey: financialKeys.chargeList(filters), queryFn: () => financialApi.listCharges(filters) }) }
export function useFinancialChargeDetail(id: number | null) { return useQuery({ queryKey: financialKeys.chargeDetail(id ?? 0), queryFn: () => financialApi.getCharge(id!), enabled: id !== null }) }
export function useFinancialMovementsList(filters: FinancialMovementListFilters) { return useQuery({ queryKey: financialKeys.movementList(filters), queryFn: () => financialApi.listMovements(filters) }) }
export function useFinancialMovementDetail(id: number | null) { return useQuery({ queryKey: financialKeys.movementDetail(id ?? 0), queryFn: () => financialApi.getMovement(id!), enabled: id !== null }) }
export function useFinancialMovementSummary(filters: Pick<FinancialMovementListFilters, 'dateFrom' | 'dateTo'>) { return useQuery({ queryKey: financialKeys.movementSummary(filters), queryFn: () => financialApi.getMovementSummary(filters) }) }
export function useDinadecoAnnualReport(year: number) { return useQuery({ queryKey: financialKeys.dinadecoAnnual(year), queryFn: () => financialApi.getDinadecoAnnualReport(year) }) }
export function useCreateFinancialMovement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateFinancialMovementInput) => financialApi.createMovement(payload),
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: [...financialKeys.movements(), 'list'] }),
      queryClient.invalidateQueries({ queryKey: [...financialKeys.movements(), 'summary'] }),
    ]),
  })
}
export function useRecordPayment() {
  const queryClient = useQueryClient()
  const refresh = (id: number) => Promise.all([
    queryClient.invalidateQueries({ queryKey: [...financialKeys.charges(), 'list'] }),
    queryClient.invalidateQueries({ queryKey: financialKeys.chargeDetail(id) }),
  ])
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RecordPaymentInput }) => financialApi.recordPayment(id, payload),
    onSuccess: (_, { id }) => void refresh(id),
    onError: (error, { id }) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) void refresh(id)
    },
  })
}
