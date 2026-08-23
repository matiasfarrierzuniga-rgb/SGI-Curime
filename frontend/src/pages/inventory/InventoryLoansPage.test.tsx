import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/shared/ui/Toast'
import { affiliatesService } from '../../services/affiliatesService'
import { inventoryItemsService } from '../../services/inventoryItemsService'
import { inventoryLoansService } from '../../services/inventoryLoansService'
import { InventoryLoansPage } from './InventoryLoansPage'

vi.mock('../../auth/AuthContext', () => ({ useAuth: () => ({ user: { role: 'Administrador' } }) }))
vi.mock('../../services/inventoryLoansService', () => ({
  inventoryLoansService: { list: vi.fn(), get: vi.fn(), create: vi.fn(), return: vi.fn(), cancel: vi.fn() },
}))
vi.mock('../../services/inventoryItemsService', () => ({
  inventoryItemsService: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), activate: vi.fn(), deactivate: vi.fn(), entry: vi.fn(), exit: vi.fn(), adjustment: vi.fn(), itemMovements: vi.fn() },
}))
vi.mock('../../services/affiliatesService', () => ({
  affiliatesService: { list: vi.fn() },
}))

const loan = {
  id: 1,
  quantity: 2,
  borrowerName: 'Juan Mora',
  borrowerAffiliateId: null,
  loanDate: '2026-01-01T00:00:00.000Z',
  expectedReturnDate: '2026-01-15T00:00:00.000Z',
  returnedAt: null,
  status: 'ACTIVE',
  notes: null,
  itemId: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  item: { id: 1, code: 'HER-001', name: 'Martillo', unit: 'unidad', category: { id: 1, name: 'Herramientas' } },
  affiliate: null,
  createdBy: { id: 1, fullName: 'Ana Pérez', email: 'ana@test.com' },
  receivedBy: null,
  isOverdue: false,
} as const

const item = { id: 1, name: 'Martillo', code: 'HER-001', currentQuantity: 10, unit: 'unidad' }

const page = () =>
  render(
    <ToastProvider>
      <InventoryLoansPage />
    </ToastProvider>,
  )

describe('InventoryLoansPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(inventoryLoansService.list).mockResolvedValue({ data: [loan], total: 1, page: 1, limit: 10 })
    vi.mocked(inventoryLoansService.get).mockResolvedValue(loan as never)
    vi.mocked(inventoryItemsService.list).mockResolvedValue({ data: [item as never], total: 1, page: 1, limit: 100 })
    vi.mocked(affiliatesService.list).mockResolvedValue({ data: [{ id: 7, fullName: 'Ana Soto', identification: '1-2' } as never], total: 1, page: 1, limit: 20 })
  })

  it('lists loans with status', async () => {
    page()
    expect(await screen.findByText('Martillo')).toBeInTheDocument()
    expect(screen.getByText('Juan Mora')).toBeInTheDocument()
    expect(screen.getAllByText('Activo').length).toBeGreaterThan(0)
  })

  it('creates a loan', async () => {
    page()
    fireEvent.click(await screen.findByRole('button', { name: 'Nuevo préstamo' }))
    const dialog = await screen.findByRole('dialog', { name: 'Nuevo préstamo' })
    fireEvent.change(within(dialog).getByLabelText('Artículo'), { target: { value: '1' } })
    fireEvent.change(within(dialog).getByLabelText('Cantidad'), { target: { value: '2' } })
    fireEvent.change(within(dialog).getByLabelText('Nombre del prestatario'), { target: { value: 'Juan Mora' } })
    fireEvent.change(within(dialog).getByLabelText('Devolución esperada'), { target: { value: '2026-02-01' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Crear préstamo' }))
    await waitFor(() =>
      expect(inventoryLoansService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: 1,
          quantity: 2,
          borrowerName: 'Juan Mora',
          expectedReturnDate: expect.stringContaining('2026-02-01'),
        }),
      ),
    )
  })

  it('returns an active loan', async () => {
    page()
    fireEvent.click(await screen.findByRole('button', { name: 'Ver detalle' }))
    const detail = await screen.findByRole('dialog', { name: 'Préstamo #1' })
    fireEvent.click(within(detail).getByRole('button', { name: 'Devolver' }))
    const returnDialog = await screen.findByRole('dialog', { name: 'Devolver préstamo #1' })
    fireEvent.change(screen.getByLabelText('Notas de devolución (opcionales)'), { target: { value: 'En buen estado' } })
    fireEvent.change(screen.getByLabelText('Condición del artículo al devolver'), { target: { value: 'GOOD' } })
    fireEvent.click(within(returnDialog).getByRole('button', { name: 'Confirmar devolución' }))
    await waitFor(() =>
      expect(inventoryLoansService.return).toHaveBeenCalledWith(1, { returnNotes: 'En buen estado', condition: 'GOOD' }),
    )
  })

  it('cancels an active loan after confirmation', async () => {
    page()
    fireEvent.click(await screen.findByRole('button', { name: 'Ver detalle' }))
    const detail = await screen.findByRole('dialog', { name: 'Préstamo #1' })
    fireEvent.click(within(detail).getByRole('button', { name: 'Cancelar' }))
    const confirm = await screen.findByRole('dialog', { name: 'Cancelar préstamo' })
    fireEvent.click(within(confirm).getByRole('button', { name: 'Cancelar préstamo' }))
    await waitFor(() => expect(inventoryLoansService.cancel).toHaveBeenCalledWith(1))
  })

  it('does not show return/cancel actions for returned loans', async () => {
    const returned = { ...loan, status: 'RETURNED', isOverdue: false } as const
    vi.mocked(inventoryLoansService.list).mockResolvedValue({ data: [returned], total: 1, page: 1, limit: 10 })
    vi.mocked(inventoryLoansService.get).mockResolvedValue(returned as never)
    page()
    fireEvent.click(await screen.findByRole('button', { name: 'Ver detalle' }))
    const detail = await screen.findByRole('dialog', { name: 'Préstamo #1' })
    expect(within(detail).queryByRole('button', { name: 'Devolver' })).not.toBeInTheDocument()
    expect(within(detail).queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
  })
})