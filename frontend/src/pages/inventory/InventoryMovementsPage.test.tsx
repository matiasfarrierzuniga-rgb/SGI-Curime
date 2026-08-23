import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { inventoryItemsService } from '../../services/inventoryItemsService'
import { inventoryMovementsService } from '../../services/inventoryMovementsService'
import { usersService } from '../../services/usersService'
import { InventoryMovementsPage } from './InventoryMovementsPage'

vi.mock('@/features/auth', () => ({ useAuth: () => ({ user: { role: 'Administrador' } }) }))
vi.mock('../../services/inventoryItemsService', () => ({ inventoryItemsService: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), activate: vi.fn(), deactivate: vi.fn(), entry: vi.fn(), exit: vi.fn(), adjustment: vi.fn(), itemMovements: vi.fn() } }))
vi.mock('../../services/inventoryMovementsService', () => ({ inventoryMovementsService: { list: vi.fn() } }))
vi.mock('../../services/usersService', () => ({ usersService: { list: vi.fn(), get: vi.fn(), update: vi.fn(), changeRole: vi.fn(), activate: vi.fn(), deactivate: vi.fn(), unlock: vi.fn() } }))

const itemRef = { id: 1, code: 'HER-001', name: 'Martillo', unit: 'unidad' }
const movement = {
  id: 1,
  type: 'ENTRY',
  quantity: 3,
  reason: 'Compra',
  reference: 'F-001',
  notes: null,
  itemId: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  item: itemRef,
  createdBy: { id: 1, fullName: 'Ana Pérez', email: 'ana@test.com' },
} as const

const page = () => render(<InventoryMovementsPage />)

describe('InventoryMovementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(inventoryMovementsService.list).mockResolvedValue({ data: [movement], total: 1, page: 1, limit: 20 })
    vi.mocked(inventoryItemsService.list).mockResolvedValue({ data: [{ id: 1, name: 'Martillo', code: 'HER-001' }] as never, total: 1, page: 1, limit: 100 })
    vi.mocked(usersService.list).mockResolvedValue({ data: [{ id: 1, fullName: 'Ana Pérez' } as never], total: 1, page: 1, limit: 100 })
  })

  it('lists movements with readable Spanish labels', async () => {
    page()
    expect(await screen.findByText('Martillo')).toBeInTheDocument()
    expect(screen.getAllByText('Entrada').length).toBeGreaterThan(0)
    expect(screen.getByText('Compra')).toBeInTheDocument()
    expect(screen.getByText('F-001')).toBeInTheDocument()
    expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0)
  })

  it('applies filters and reloads', async () => {
    page()
    await screen.findByText('Martillo')
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'EXIT' } })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    await waitFor(() =>
      expect(inventoryMovementsService.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ type: 'EXIT' }),
      ),
    )
  })

  it('shows an empty state and an error state', async () => {
    vi.mocked(inventoryMovementsService.list).mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 20 })
    page()
    expect(await screen.findByText(/No hay movimientos que coincidan/)).toBeInTheDocument()

    vi.mocked(inventoryMovementsService.list).mockRejectedValueOnce(new Error('x'))
    page()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})