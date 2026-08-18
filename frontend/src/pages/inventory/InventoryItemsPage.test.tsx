import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '../../components/Toast'
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

const conflict = (message: string) => ({ isAxiosError: true, response: { status: 409, data: { message } } })

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

  it('creates an item through the modal', async () => {
    page()
    fireEvent.click(await screen.findByRole('button', { name: 'Nuevo artículo' }))
    const dialog = await screen.findByRole('dialog', { name: 'Nuevo artículo' })
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'HER-002' } })
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Tornillo' } })
    fireEvent.change(within(dialog).getByLabelText('Categoría'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Cantidad mínima'), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() =>
      expect(inventoryItemsService.create).toHaveBeenCalledWith({
        code: 'HER-002',
        name: 'Tornillo',
        description: undefined,
        categoryId: 1,
        minimumQuantity: 3,
        unit: 'unidad',
        location: undefined,
        condition: 'GOOD',
      }),
    )
  })

  it('records an entry', async () => {
    page()
    fireEvent.click(await screen.findByRole('button', { name: 'Entrada' }))
    await screen.findByRole('dialog', { name: /Registrar entrada: Martillo/ })
    fireEvent.change(screen.getByLabelText('Cantidad'), { target: { value: '3' } })
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Compra' } })
    fireEvent.change(screen.getByLabelText('Referencia (opcional)'), { target: { value: 'F-001' } })
    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }))
    await waitFor(() =>
      expect(inventoryItemsService.entry).toHaveBeenCalledWith(1, {
        quantity: 3,
        reason: 'Compra',
        reference: 'F-001',
        notes: undefined,
      }),
    )
    expect(await screen.findByText('Entrada registrada correctamente.')).toBeInTheDocument()
  })

  it('shows a clear message when there is insufficient stock on an exit', async () => {
    vi.mocked(inventoryItemsService.exit).mockRejectedValueOnce(conflict('Insufficient stock'))
    page()
    fireEvent.click(await screen.findByRole('button', { name: 'Salida' }))
    await screen.findByRole('dialog', { name: /Registrar salida: Martillo/ })
    fireEvent.change(screen.getByLabelText('Cantidad'), { target: { value: '99' } })
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Uso interno' } })
    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }))
    expect(await screen.findByText('No hay stock suficiente disponible para registrar esta salida.')).toBeInTheDocument()
  })

  it('registers an adjustment', async () => {
    page()
    fireEvent.click(await screen.findByRole('button', { name: 'Ver detalle' }))
    await screen.findByRole('dialog', { name: /Artículo: Martillo/ })
    fireEvent.click(screen.getByRole('button', { name: 'Realizar ajuste' }))
    await screen.findByRole('dialog', { name: /Ajuste de inventario: Martillo/ })
    fireEvent.change(screen.getByLabelText('Nueva cantidad'), { target: { value: '8' } })
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Conteo físico' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ajustar' }))
    await waitFor(() =>
      expect(inventoryItemsService.adjustment).toHaveBeenCalledWith(1, {
        newQuantity: 8,
        reason: 'Conteo físico',
        notes: undefined,
      }),
    )
  })
})