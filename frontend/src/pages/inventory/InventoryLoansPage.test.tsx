import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/shared/ui/Toast'
import { inventoryItemsService } from '../../services/inventoryItemsService'
import { inventoryLoansService } from '../../services/inventoryLoansService'
import { InventoryLoansPage } from './InventoryLoansPage'

const authState = vi.hoisted(() => ({ permissionCodes: [] as string[] }))

vi.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { permissionCodes: authState.permissionCodes } }),
}))

vi.mock('../../services/inventoryLoansService', () => ({
  inventoryLoansService: { list: vi.fn(), get: vi.fn(), create: vi.fn(), return: vi.fn(), cancel: vi.fn() },
}))
vi.mock('../../services/inventoryItemsService', () => ({
  inventoryItemsService: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), activate: vi.fn(), deactivate: vi.fn(), entry: vi.fn(), exit: vi.fn(), adjustment: vi.fn(), itemMovements: vi.fn() },
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
    authState.permissionCodes = ['inv.inventory.read']
    vi.mocked(inventoryLoansService.list).mockResolvedValue({ data: [loan], total: 1, page: 1, limit: 10 })
    vi.mocked(inventoryLoansService.get).mockResolvedValue(loan as never)
    vi.mocked(inventoryItemsService.list).mockResolvedValue({ data: [item as never], total: 1, page: 1, limit: 100 })
  })

  it('groups the overdue filter with its accessible label', async () => {
    page()

    const overdueFilter = await screen.findByRole('checkbox', { name: 'Solo vencidos' })
    expect(screen.getByRole('group', { name: 'Vencimiento' })).toContainElement(overdueFilter)
  })

  it('lists loans with status', async () => {
    page()
    expect(await screen.findByText('Martillo')).toBeInTheDocument()
    expect(screen.getByText('Juan Mora')).toBeInTheDocument()
    expect(screen.getAllByText('Activo').length).toBeGreaterThan(0)
  })

  it('keeps loan mutations hidden for read-only users', async () => {
    page()
    await screen.findByText('Martillo')
    for (const action of ['Nuevo préstamo', 'Devolver', 'Cancelar']) {
      expect(screen.queryByRole('button', { name: action })).not.toBeInTheDocument()
    }
    expect(inventoryLoansService.create).not.toHaveBeenCalled()
    expect(inventoryLoansService.return).not.toHaveBeenCalled()
    expect(inventoryLoansService.cancel).not.toHaveBeenCalled()
  })

  it('shows loan operations with inventory.loan.manage', async () => {
    authState.permissionCodes = ['inv.inventory.read', 'inventory.loan.manage']
    page()

    await screen.findByText('Martillo')
    expect(screen.getByRole('button', { name: 'Nuevo préstamo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Devolver' })).toBeInTheDocument()
  })
})
