import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { inventoryAlertsService } from '../../services/inventoryAlertsService'
import { InventoryAlertsPage } from './InventoryAlertsPage'

vi.mock('../../services/inventoryAlertsService', () => ({ inventoryAlertsService: { get: vi.fn() } }))

const alerts = {
  summary: { lowStock: 1, outOfStock: 1, overdueLoans: 1, inactiveItems: 1, damagedItems: 1 },
  lowStock: [{ id: 1, code: 'A-1', name: 'Tornillos', currentQuantity: 2, minimumQuantity: 5, unit: 'unidad', location: null, status: 'ACTIVE', condition: 'GOOD' }],
  outOfStock: [{ id: 2, code: 'A-2', name: 'Pintura', currentQuantity: 0, minimumQuantity: 3, unit: 'litro', location: null, status: 'ACTIVE', condition: 'GOOD' }],
  overdueLoans: [{ id: 9, quantity: 1, borrowerName: 'Juan Mora', loanDate: '2026-01-01T00:00:00.000Z', expectedReturnDate: '2026-01-02T00:00:00.000Z', item: { id: 3, code: 'A-3', name: 'Martillo', unit: 'unidad' }, affiliate: null }],
  inactiveItems: [{ id: 4, code: 'A-4', name: 'Sierra', currentQuantity: 1, minimumQuantity: 0, unit: 'unidad', location: null, status: 'INACTIVE', condition: 'GOOD' }],
  damagedItems: [{ id: 5, code: 'A-5', name: 'Taladro', currentQuantity: 1, minimumQuantity: 0, unit: 'unidad', location: null, status: 'ACTIVE', condition: 'DAMAGED' }],
} as const

const page = () =>
  render(
    <MemoryRouter>
      <InventoryAlertsPage />
    </MemoryRouter>,
  )

describe('InventoryAlertsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(inventoryAlertsService.get).mockResolvedValue(alerts as never)
  })

  it('shows counters and grouped alert lists with navigation links', async () => {
    page()
    expect(await screen.findAllByText('Stock bajo')).not.toHaveLength(0)
    expect(screen.getAllByText('Agotados').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Préstamos vencidos').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Artículos inactivos').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Artículos dañados').length).toBeGreaterThan(0)
    expect(screen.getByText(/Tornillos/)).toBeInTheDocument()
    expect(screen.getByText(/Pintura/)).toBeInTheDocument()
    expect(screen.getByText('Juan Mora')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Ver artículo' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Ver préstamo' })).toHaveAttribute('href', '/inventory/loans?highlight=9')
  })

  it('shows an empty state when there are no alerts', async () => {
    vi.mocked(inventoryAlertsService.get).mockResolvedValueOnce({
      summary: { lowStock: 0, outOfStock: 0, overdueLoans: 0, inactiveItems: 0, damagedItems: 0 },
      lowStock: [],
      outOfStock: [],
      overdueLoans: [],
      inactiveItems: [],
      damagedItems: [],
    } as never)
    page()
    expect(await screen.findByText(/No hay alertas pendientes/)).toBeInTheDocument()
  })

  it('shows an error state', async () => {
    vi.mocked(inventoryAlertsService.get).mockRejectedValueOnce(new Error('x'))
    page()
    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible cargar las alertas.')
  })
})