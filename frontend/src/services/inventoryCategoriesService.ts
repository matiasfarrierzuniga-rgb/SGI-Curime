import { httpClient } from '../api/httpClient'
import type { InventoryCategory, InventoryCategoryListResponse, InventoryCategoryQuery, CreateInventoryCategoryInput, UpdateInventoryCategoryInput } from '../types/inventory'

export const inventoryCategoriesService = {
  async list(params: InventoryCategoryQuery) {
    return (await httpClient.get<InventoryCategoryListResponse>('/inventory/categories', { params })).data
  },
  async get(id: number) {
    return (await httpClient.get<InventoryCategory>(`/inventory/categories/${id}`)).data
  },
  async create(payload: CreateInventoryCategoryInput) {
    return (await httpClient.post<InventoryCategory>('/inventory/categories', payload)).data
  },
  async update(id: number, payload: UpdateInventoryCategoryInput) {
    return (await httpClient.patch<InventoryCategory>(`/inventory/categories/${id}`, payload)).data
  },
  async activate(id: number) {
    return (await httpClient.patch<InventoryCategory>(`/inventory/categories/${id}/activate`)).data
  },
  async deactivate(id: number) {
    return (await httpClient.patch<InventoryCategory>(`/inventory/categories/${id}/deactivate`)).data
  },
}