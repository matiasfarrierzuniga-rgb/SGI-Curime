import { httpClient } from '@/shared/api/httpClient'
import type {
  CreateAdjustmentInput,
  CreateInventoryItemInput,
  CreateMovementInput,
  InventoryItem,
  InventoryItemListResponse,
  InventoryItemQuery,
  InventoryMovement,
  InventoryMovementListResponse,
  InventoryMovementQuery,
  UpdateInventoryItemInput,
} from '../types/inventory'

export const inventoryItemsService = {
  async list(params: InventoryItemQuery) {
    return (await httpClient.get<InventoryItemListResponse>('/inventory/items', { params })).data
  },
  async get(id: number) {
    return (await httpClient.get<InventoryItem>(`/inventory/items/${id}`)).data
  },
  async create(payload: CreateInventoryItemInput) {
    return (await httpClient.post<InventoryItem>('/inventory/items', payload)).data
  },
  async update(id: number, payload: UpdateInventoryItemInput) {
    return (await httpClient.patch<InventoryItem>(`/inventory/items/${id}`, payload)).data
  },
  async activate(id: number) {
    return (await httpClient.patch<InventoryItem>(`/inventory/items/${id}/activate`)).data
  },
  async deactivate(id: number) {
    return (await httpClient.patch<InventoryItem>(`/inventory/items/${id}/deactivate`)).data
  },
  async entry(id: number, payload: CreateMovementInput) {
    return (await httpClient.post<InventoryMovement>(`/inventory/items/${id}/entries`, payload)).data
  },
  async exit(id: number, payload: CreateMovementInput) {
    return (await httpClient.post<InventoryMovement>(`/inventory/items/${id}/exits`, payload)).data
  },
  async adjustment(id: number, payload: CreateAdjustmentInput) {
    return (await httpClient.post<InventoryMovement>(`/inventory/items/${id}/adjustments`, payload)).data
  },
  async itemMovements(id: number, params: InventoryMovementQuery) {
    return (await httpClient.get<InventoryMovementListResponse>(`/inventory/items/${id}/movements`, { params })).data
  },
}