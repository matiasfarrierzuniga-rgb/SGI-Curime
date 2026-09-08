import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { absenceJustificationsService } from '../api/absenceJustifications.api'
import type {
  AbsenceJustificationListFilters,
  RejectAbsenceJustificationPayload,
  ReviewAbsenceJustificationPayload,
} from '../model/absenceJustifications.types'

function normalizeFilters(filters: AbsenceJustificationListFilters) {
  return {
    status: filters.status,
    assemblyId: filters.assemblyId,
    affiliateId: filters.affiliateId,
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
  }
}

export const absenceJustificationsKeys = {
  all: ['absence-justifications'] as const,
  list: (filters: AbsenceJustificationListFilters) => [...absenceJustificationsKeys.all, 'list', normalizeFilters(filters)] as const,
}

export function useAbsenceJustificationsList(filters: AbsenceJustificationListFilters) {
  const normalized = normalizeFilters(filters)

  return useQuery({
    queryKey: absenceJustificationsKeys.list(normalized),
    queryFn: () => absenceJustificationsService.list(normalized),
  })
}

export function useAbsenceJustificationsMutations() {
  const queryClient = useQueryClient()
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: absenceJustificationsKeys.all })
  }

  return {
    approve: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload?: ReviewAbsenceJustificationPayload }) =>
        absenceJustificationsService.approve(id, payload),
      onSuccess: invalidate,
    }),
    reject: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: RejectAbsenceJustificationPayload }) =>
        absenceJustificationsService.reject(id, payload),
      onSuccess: invalidate,
    }),
  }
}
