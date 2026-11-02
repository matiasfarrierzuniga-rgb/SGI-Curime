import { useQuery } from '@tanstack/react-query'
import { territorialCatalogApi } from '../api/territorialCatalog.api'

export const territorialCatalogKeys = {
  all: ['territorial-catalog'] as const,
  provinces: () => [...territorialCatalogKeys.all, 'provinces'] as const,
  cantons: (provinceCode: string) => [...territorialCatalogKeys.all, 'cantons', provinceCode] as const,
  districts: (provinceCode: string, cantonCode: string) => [...territorialCatalogKeys.all, 'districts', provinceCode, cantonCode] as const,
  localities: (provinceCode: string, cantonCode: string, districtCode: string) => [...territorialCatalogKeys.all, 'localities', provinceCode, cantonCode, districtCode] as const,
}

export function useTerritorialCatalog(provinceCode: string, cantonCode: string, districtCode: string) {
  const provinces = useQuery({ queryKey: territorialCatalogKeys.provinces(), queryFn: ({ signal }) => territorialCatalogApi.provinces({ signal }), retry: false })
  const cantons = useQuery({ queryKey: territorialCatalogKeys.cantons(provinceCode), queryFn: ({ signal }) => territorialCatalogApi.cantons(provinceCode, { signal }), enabled: Boolean(provinceCode), retry: false })
  const districts = useQuery({ queryKey: territorialCatalogKeys.districts(provinceCode, cantonCode), queryFn: ({ signal }) => territorialCatalogApi.districts(provinceCode, cantonCode, { signal }), enabled: Boolean(provinceCode && cantonCode), retry: false })
  const localities = useQuery({ queryKey: territorialCatalogKeys.localities(provinceCode, cantonCode, districtCode), queryFn: ({ signal }) => territorialCatalogApi.localities(provinceCode, cantonCode, districtCode, { signal }), enabled: Boolean(provinceCode && cantonCode && districtCode), retry: false })
  return { provinces, cantons, districts, localities }
}
