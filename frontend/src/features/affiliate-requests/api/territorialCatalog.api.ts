import { httpClient } from '@/shared/api/httpClient'

export type TerritorialOption = { code: string; name: string }
export type TerritorialLocality = { localityKey: string; name: string; category: string }
export type TerritorialCatalogResponse<T> = { catalogVersion: string; items: T[] }

export const territorialCatalogApi = {
  provinces: async ({ signal }: { signal?: AbortSignal } = {}) => (await httpClient.get<TerritorialCatalogResponse<TerritorialOption>>('/territorial-catalog/provinces', { signal })).data,
  cantons: async (provinceCode: string, { signal }: { signal?: AbortSignal } = {}) => (await httpClient.get<TerritorialCatalogResponse<TerritorialOption>>('/territorial-catalog/cantons', { params: { provinceCode }, signal })).data,
  districts: async (provinceCode: string, cantonCode: string, { signal }: { signal?: AbortSignal } = {}) => (await httpClient.get<TerritorialCatalogResponse<TerritorialOption>>('/territorial-catalog/districts', { params: { provinceCode, cantonCode }, signal })).data,
  localities: async (provinceCode: string, cantonCode: string, districtCode: string, { signal }: { signal?: AbortSignal } = {}) => (await httpClient.get<TerritorialCatalogResponse<TerritorialLocality>>('/territorial-catalog/localities', { params: { provinceCode, cantonCode, districtCode }, signal })).data,
}
