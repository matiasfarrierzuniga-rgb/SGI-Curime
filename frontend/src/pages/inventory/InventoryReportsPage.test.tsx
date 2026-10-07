import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { inventoryCategoriesService } from '../../services/inventoryCategoriesService'
import { inventoryReportsService } from '../../services/inventoryReportsService'
import { InventoryReportsPage } from './InventoryReportsPage'

vi.mock('../../services/inventoryCategoriesService', () => ({
  inventoryCategoriesService: { list: vi.fn() },
}))

vi.mock('../../services/inventoryReportsService', () => ({
  inventoryReportsService: {
    summary: vi.fn(),
    stock: vi.fn(),
    movements: vi.fn(),
    loans: vi.fn(),
  },
}))

describe('InventoryReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(inventoryCategoriesService.list).mockResolvedValue({
      data: [{ id: 3, name: 'Herramientas' }],
      total: 1,
      page: 1,
      limit: 100,
    })
    vi.mocked(inventoryReportsService.summary).mockResolvedValue({
      totalItems: 4,
      activeItems: 3,
      inactiveItems: 1,
      totalCategories: 1,
      lowStockCount: 1,
      outOfStockCount: 0,
      activeLoans: 2,
      overdueLoans: 1,
    })
    vi.mocked(inventoryReportsService.stock).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    })
    vi.mocked(inventoryReportsService.movements).mockResolvedValue({
      period: { dateFrom: null, dateTo: null },
      summary: {
        openingBalances: { count: 2, quantity: 16 },
        entries: { count: 3, quantity: 12 },
        exits: { count: 1, quantity: 4 },
        adjustments: { count: 1, quantity: -2 },
      },
    })
    vi.mocked(inventoryReportsService.loans).mockResolvedValue({
      period: { dateFrom: null, dateTo: null },
      summary: { active: 2, returned: 1, cancelled: 0, overdue: 1, total: 3 },
    })
  })

  it('displays opening balances separately from entries and adjustments', async () => {
    render(<InventoryReportsPage />)

    expect(await screen.findByText('Saldo inicial (cantidad: 16)')).toBeInTheDocument()
    expect(screen.getByText('Entrada (cantidad: 12)')).toBeInTheDocument()
    expect(screen.getByText('Salida (cantidad: 4)')).toBeInTheDocument()
    expect(screen.getByText('Ajuste (cantidad: -2)')).toBeInTheDocument()
  })

  it('submits the opening balance movement type as a report filter', async () => {
    render(<InventoryReportsPage />)
    await screen.findByText('Saldo inicial (cantidad: 16)')

    fireEvent.change(screen.getByLabelText('Tipo (movimientos)'), {
      target: { value: 'OPENING_BALANCE' },
    })
    fireEvent.change(screen.getByLabelText('Categoría'), {
      target: { value: '3' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))

    await waitFor(() => {
      expect(inventoryReportsService.movements).toHaveBeenLastCalledWith(
        expect.objectContaining({
          categoryId: 3,
          type: 'OPENING_BALANCE',
        }),
      )
    })
  })
})
