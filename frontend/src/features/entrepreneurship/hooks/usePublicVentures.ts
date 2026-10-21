import { useQuery } from '@tanstack/react-query'
import { publicVenturesApi } from '../api/publicVentures.api'
import type { PublicVenturesQuery } from '../model/publicVentures.types'

export const publicVenturesKeys = {
  all: ['public-ventures'] as const,
  list: (query: PublicVenturesQuery) => [...publicVenturesKeys.all, 'list', query] as const,
  detail: (id: number) => [...publicVenturesKeys.all, 'detail', id] as const,
}

export function usePublicVentures(query: PublicVenturesQuery) {
  return useQuery({ queryKey: publicVenturesKeys.list(query), queryFn: () => publicVenturesApi.list(query) })
}

export function usePublicVenture(id: number | null) {
  return useQuery({ queryKey: publicVenturesKeys.detail(id ?? 0), queryFn: () => publicVenturesApi.get(id!), enabled: id !== null })
}
