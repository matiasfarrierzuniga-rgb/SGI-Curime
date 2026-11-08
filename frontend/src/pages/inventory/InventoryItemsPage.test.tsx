import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/shared/ui/Toast'
import { inventoryItemsService } from '../../services/inventoryItemsService'
import { inventoryCategoriesService } from '../../services/inventoryCategoriesService'
import { InventoryItemsPage } from './InventoryItemsPage'

vi.mock('../../services/inventoryItemsService', () => ({
  inventoryItemsService: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    activate: vi.fn(),
    deactivate: vi.fn(),
    entry: vi.fn(),
    exit: vi.fn(),
    adjustment: vi.fn(),
    itemMovements: vi.fn(),
  },
}))

vi.mock('../../services/inventoryCategoriesService', () => ({
  inventoryCategoriesService: { list: vi.fn() },
}))

const category = { id: 1, name: 'Herramientas', description: null, isActive: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }

const item = {
  id: 1,
  code: 'HER-001',
  name: 'Martillo',
  description: null,
  currentQuantity: 5,
  minimumQuantity: 2,
  unit: 'unidad',
  location: 'Bodega A',
  status: 'ACTIVE',
  condition: 'GOOD',
  categoryId: 1,
  category: { id: 1, name: 'Herramientas', isActive: true },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as const

const page = () =>
  render(
    <ToastProvider>
      <InventoryItemsPage />
    </ToastProvider>,
  )

describe('InventoryItemsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(inventoryItemsService.list).mockResolvedValue({ data: [item], total: 1, page: 1, limit: 10 })
    vi.mocked(inventoryItemsService.get).mockResolvedValue(item as never)
    vi.mocked(inventoryCategoriesService.list).mockResolvedValue({ data: [category], total: 1, page: 1, limit: 100 })
  })

  it('lists items with their data', async () => {
    page()
    expect(await screen.findByText('Martillo')).toBeInTheDocument()
    expect(screen.getByText('HER-001')).toBeInTheDocument()
    expect(screen.getAllByText('Herramientas').length).toBeGreaterThan(0)
    expect(screen.getByText('Bodega A')).toBeInTheDocument()
    expect(screen.getByText('Bueno')).toBeInTheDocument()
  })

  it('shows the empty state when there are no registered goods', async () => {
    vi.mocked(inventoryItemsService.list).mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 })
    page()

    expect(await screen.findByText('No hay bienes registrados en el inventario.')).toBeInTheDocument()
  })

  it('shows an error state when the inventory cannot be loaded', async () => {
    vi.mocked(inventoryItemsService.list).mockRejectedValueOnce(new Error('network error'))
    page()

    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible cargar los artículos.')
  })

  it('hides unsupported inventory mutations', async () => {
    page()
    await screen.findByText('Martillo')
    for (const action of ['Nuevo artículo', 'Editar', 'Entrada', 'Salida', 'Realizar ajuste']) {
      expect(screen.queryByRole('button', { name: action })).not.toBeInTheDocument()
    }
    expect(inventoryItemsService.create).not.toHaveBeenCalled()
    expect(inventoryItemsService.update).not.toHaveBeenCalled()
    expect(inventoryItemsService.entry).not.toHaveBeenCalled()
    expect(inventoryItemsService.exit).not.toHaveBeenCalled()
    expect(inventoryItemsService.adjustment).not.toHaveBeenCalled()
  })
})
