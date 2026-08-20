import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InventoryDashboardPage } from './InventoryDashboardPage'
import { inventoryReportsService } from '../../services/inventoryReportsService'

vi.mock('../../services/inventoryReportsService', () => ({
  inventoryReportsService: { summary: vi.fn() },
}))

const summary = {
  totalItems: 10,
  activeItems: 7,
  inactiveItems: 3,
  totalCategories: 4,
  lowStockCount: 2,
  outOfStockCount: 1,
  activeLoans: 3,
  overdueLoans: 1,
}

const page = () =>
  render(
    <MemoryRouter>
      <InventoryDashboardPage />
    </MemoryRouter>,
  )

describe('InventoryDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(inventoryReportsService.summary).mockResolvedValue(summary)
  })

  it('shows loading and then the summary cards', async () => {
    page()
    expect(screen.getByText(/Cargando resumen de inventario/)).toBeInTheDocument()
    expect(await screen.findByText('10')).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByText('Artículos').length).toBeGreaterThan(0))
    expect(screen.getByText('Activos')).toBeInTheDocument()
    expect(screen.getAllByText('Préstamos vencidos').length).toBeGreaterThan(0)
  })

  it('shows the quick access links', async () => {
    page()
    await screen.findByText('Artículos')
    expect(screen.getByRole('link', { name: 'Artículos' })).toHaveAttribute('href', '/inventory/items')
    expect(screen.getByRole('link', { name: 'Categorías' })).toHaveAttribute('href', '/inventory/categories')
    expect(screen.getByRole('link', { name: 'Movimientos' })).toHaveAttribute('href', '/inventory/movements')
    expect(screen.getByRole('link', { name: 'Préstamos' })).toHaveAttribute('href', '/inventory/loans')
    expect(screen.getByRole('link', { name: 'Alertas' })).toHaveAttribute('href', '/inventory/alerts')
    expect(screen.getByRole('link', { name: 'Reportes' })).toHaveAttribute('href', '/inventory/reports')
  })

  it('shows an error state when the summary fails', async () => {
    vi.mocked(inventoryReportsService.summary).mockRejectedValueOnce(new Error('x'))
    page()
    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible cargar el resumen de inventario.')
  })
})