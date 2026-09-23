import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { institutionalBoardApi, type AppointmentInput, type UpdateAppointmentInput } from '../api/institutionalBoard.api'
export const boardKeys = { terms: ['institutional-board', 'terms'] as const, candidates: (q: string) => ['institutional-board', 'candidates', q] as const }
export const useBoardTerms = () => useQuery({ queryKey: boardKeys.terms, queryFn: institutionalBoardApi.terms })
export const usePersonCandidates = (query: string) => useQuery({ queryKey: boardKeys.candidates(query), queryFn: () => institutionalBoardApi.candidates(query), enabled: query.trim().length >= 2 })
export function useBoardMutations() { const client = useQueryClient(); const refresh = () => client.invalidateQueries({ queryKey: boardKeys.terms }); return {
  createTerm: useMutation({ mutationFn: institutionalBoardApi.createTerm, onSuccess: refresh }),
  createAppointment: useMutation({ mutationFn: ({ termId, input }: { termId: number; input: AppointmentInput }) => institutionalBoardApi.createAppointment(termId, input), onSuccess: refresh }),
  updateAppointment: useMutation({ mutationFn: ({ id, input }: { id: number; input: UpdateAppointmentInput }) => institutionalBoardApi.updateAppointment(id, input), onSuccess: refresh }),
} }
