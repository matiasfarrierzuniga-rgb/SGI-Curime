import type {
  InventoryItemCondition,
  InventoryItemStatus,
} from './inventoryItem.types'

export const itemStatusLabels: Record<InventoryItemStatus, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
}

export const conditionLabels: Record<InventoryItemCondition, string> = {
  GOOD: 'Bueno',
  DAMAGED: 'Dañado',
  UNDER_REPAIR: 'En reparación',
}
