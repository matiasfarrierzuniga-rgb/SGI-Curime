import type { PaginatedResponse } from './api'

export type InventoryItemStatus = 'ACTIVE' | 'INACTIVE'
export type InventoryItemCondition = 'GOOD' | 'DAMAGED' | 'UNDER_REPAIR'
export type InventoryMovementType = 'ENTRY' | 'EXIT' | 'ADJUSTMENT'
export type InventoryLoanStatus = 'ACTIVE' | 'RETURNED' | 'CANCELLED'

export interface InventoryCategory {
  id: number
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface InventoryItemCategory {
  id: number
  name: string
  isActive: boolean
}

export interface InventoryItem {
  id: number
  code: string
  name: string
  description: string | null
  currentQuantity: number
  minimumQuantity: number
  unit: string
  location: string | null
  status: InventoryItemStatus
  condition: InventoryItemCondition
  categoryId: number
  category: InventoryItemCategory
  createdAt: string
  updatedAt: string
}

export interface InventoryActor {
  id: number
  fullName: string
  email: string
}

export interface InventoryMovement {
  id: number
  type: InventoryMovementType
  quantity: number
  reason: string
  reference: string | null
  notes: string | null
  itemId: number
  createdAt: string
  item: { id: number; code: string; name: string; unit: string }
  createdBy: InventoryActor | null
}

export interface InventoryLoan {
  id: number
  quantity: number
  borrowerName: string
  borrowerAffiliateId: number | null
  loanDate: string
  expectedReturnDate: string
  returnedAt: string | null
  status: InventoryLoanStatus
  notes: string | null
  itemId: number
  createdAt: string
  updatedAt: string
  item: { id: number; code: string; name: string; unit: string; category: { id: number; name: string } }
  affiliate: { id: number; fullName: string; identification: string } | null
  createdBy: InventoryActor | null
  receivedBy: InventoryActor | null
  isOverdue: boolean
}

export interface InventoryItemAlert {
  id: number
  code: string
  name: string
  currentQuantity: number
  minimumQuantity: number
  unit: string
  location: string | null
  status: InventoryItemStatus
  condition: InventoryItemCondition
}

export interface InventoryLoanAlert {
  id: number
  quantity: number
  borrowerName: string
  loanDate: string
  expectedReturnDate: string
  item: { id: number; code: string; name: string; unit: string }
  affiliate: { id: number; fullName: string } | null
}

export interface InventoryAlertSummary {
  lowStock: number
  outOfStock: number
  overdueLoans: number
  inactiveItems: number
  damagedItems: number
}

export interface InventoryAlerts {
  summary: InventoryAlertSummary
  lowStock: InventoryItemAlert[]
  outOfStock: InventoryItemAlert[]
  overdueLoans: InventoryLoanAlert[]
  inactiveItems: InventoryItemAlert[]
  damagedItems: InventoryItemAlert[]
}

export interface InventoryReportSummary {
  totalItems: number
  activeItems: number
  inactiveItems: number
  totalCategories: number
  lowStockCount: number
  outOfStockCount: number
  activeLoans: number
  overdueLoans: number
}

export interface InventoryStockRow {
  id: number
  code: string
  name: string
  currentQuantity: number
  minimumQuantity: number
  unit: string
  location: string | null
  status: InventoryItemStatus
  condition: InventoryItemCondition
  categoryId: number
  category: { id: number; name: string }
}

export interface InventoryMovementReport {
  period: { dateFrom: string | null; dateTo: string | null }
  summary: {
    entries: { count: number; quantity: number }
    exits: { count: number; quantity: number }
    adjustments: { count: number; quantity: number }
  }
}

export interface InventoryLoansReport {
  period: { dateFrom: string | null; dateTo: string | null }
  summary: { active: number; returned: number; cancelled: number; overdue: number; total: number }
}

export interface AffiliateOption {
  id: number
  fullName: string
  identification: string
}

export interface InventoryCategoryQuery {
  search?: string
  active?: boolean
  page?: number
  limit?: number
}

export interface InventoryItemQuery {
  search?: string
  code?: string
  categoryId?: number
  status?: InventoryItemStatus
  lowStock?: boolean
  page?: number
  limit?: number
}

export interface InventoryMovementQuery {
  itemId?: number
  categoryId?: number
  type?: InventoryMovementType
  userId?: number
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export interface InventoryLoanQuery {
  itemId?: number
  affiliateId?: number
  status?: InventoryLoanStatus
  overdue?: boolean
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export interface InventoryReportQuery {
  dateFrom?: string
  dateTo?: string
  categoryId?: number
  status?: InventoryItemStatus
  type?: InventoryMovementType
  page?: number
  limit?: number
}

export interface AffiliateQuery {
  search?: string
  page?: number
  limit?: number
}

export interface CreateInventoryCategoryInput {
  name: string
  description?: string
}

export interface UpdateInventoryCategoryInput {
  name?: string
  description?: string
}

export interface CreateInventoryItemInput {
  code: string
  name: string
  description?: string
  categoryId: number
  minimumQuantity?: number
  unit?: string
  location?: string
  condition?: InventoryItemCondition
}

export interface UpdateInventoryItemInput {
  code?: string
  name?: string
  description?: string
  categoryId?: number
  minimumQuantity?: number
  unit?: string
  location?: string
  condition?: InventoryItemCondition
}

export interface CreateMovementInput {
  quantity: number
  reason: string
  reference?: string
  notes?: string
}

export interface CreateAdjustmentInput {
  newQuantity: number
  reason: string
  notes?: string
}

export interface CreateLoanInput {
  itemId: number
  quantity: number
  borrowerName: string
  borrowerAffiliateId?: number
  loanDate?: string
  expectedReturnDate: string
  notes?: string
}

export interface ReturnLoanInput {
  returnNotes?: string
  condition?: InventoryItemCondition
}

export const movementTypeLabels: Record<InventoryMovementType, string> = {
  ENTRY: 'Entrada',
  EXIT: 'Salida',
  ADJUSTMENT: 'Ajuste',
}

export const itemStatusLabels: Record<InventoryItemStatus, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
}

export const conditionLabels: Record<InventoryItemCondition, string> = {
  GOOD: 'Bueno',
  DAMAGED: 'Dañado',
  UNDER_REPAIR: 'En reparación',
}

export const loanStatusLabels: Record<InventoryLoanStatus, string> = {
  ACTIVE: 'Activo',
  RETURNED: 'Devuelto',
  CANCELLED: 'Cancelado',
}

export type InventoryCategoryListResponse = PaginatedResponse<InventoryCategory>
export type InventoryItemListResponse = PaginatedResponse<InventoryItem>
export type InventoryMovementListResponse = PaginatedResponse<InventoryMovement>
export type InventoryLoanListResponse = PaginatedResponse<InventoryLoan>
export type InventoryStockListResponse = PaginatedResponse<InventoryStockRow>
export type AffiliateListResponse = PaginatedResponse<AffiliateOption>