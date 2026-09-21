import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { institutionalProfileApi } from '../api/institutionalProfile.api'

export const institutionalProfileKeys = { all: ['institutional-profile'] as const }
export function useInstitutionalProfile() { return useQuery({ queryKey: institutionalProfileKeys.all, queryFn: institutionalProfileApi.get }) }
export function useUpdateInstitutionalProfile() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: institutionalProfileApi.update, onSuccess: profile => queryClient.setQueryData(institutionalProfileKeys.all, profile) })
}
