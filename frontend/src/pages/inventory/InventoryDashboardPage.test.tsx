import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InventoryDashboardPage } from './InventoryDashboardPage'
import { inventoryReportsService } from '../../services/inventoryReportsService'
import { inventoryAlertsService } from '../../services/inventoryAlertsService'
import { inventoryItemsService } from '../../services/inventoryItemsService'
import { inventoryMovementsService } from '../../services/inventoryMovementsService'

const auth = vi.hoisted(() => ({
  user: { permissionCodes: ['inv.inventory.read'] as string[] },
}))

vi.mock('@/features/auth', () => ({
  useAuth: () => auth,
}))

vi.mock('../../services/inventoryReportsService', () => ({
  inventoryReportsService: { summary: vi.fn() },
}))

vi.mock('../../services/inventoryAlertsService', () => ({
  inventoryAlertsService: { get: vi.fn() },
}))
vi.mock('../../services/inventoryItemsService', () => ({
  inventoryItemsService: { list: vi.fn() },
}))
vi.mock('../../services/inventoryMovementsService', () => ({
  inventoryMovementsService: { list: vi.fn() },
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
    auth.user.permissionCodes = ['inv.inventory.read']
    vi.mocked(inventoryReportsService.summary).mockResolvedValue(summary)
    vi.mocked(inventoryAlertsService.get).mockResolvedValue({
      summary: { lowStock: 0, outOfStock: 0, overdueLoans: 0, inactiveItems: 0, damagedItems: 0 },
      lowStock: [], outOfStock: [], overdueLoans: [], inactiveItems: [], damagedItems: [],
    })
    vi.mocked(inventoryItemsService.list).mockResolvedValue({ data: [], total: 0, page: 1, limit: 100 })
    vi.mocked(inventoryMovementsService.list).mockResolvedValue({ data: [], total: 0, page: 1, limit: 100 })
  })

  it('shows loading and then the summary cards', async () => {
    page()
    expect(screen.getByText(/Cargando resumen de inventario/)).toBeInTheDocument()
    expect(await screen.findByText('10')).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByText('Artículos').length).toBeGreaterThan(0))
    expect(screen.getAllByText('Activos').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Préstamos vencidos').length).toBeGreaterThan(0)
  })

  it('shows the quick access links', async () => {
    page()
    await screen.findByText('Artículos')
    const quickAccess = screen.getByRole('navigation', { name: 'Accesos rápidos de inventario' })
    expect(within(quickAccess).getAllByRole('link')).toHaveLength(5)
    expect(within(quickAccess).getByRole('link', { name: 'Artículos' })).toHaveAttribute('href', '/inventory/items')
    expect(within(quickAccess).getByRole('link', { name: 'Categorías' })).toHaveAttribute('href', '/inventory/categories')
    expect(within(quickAccess).getByRole('link', { name: 'Movimientos' })).toHaveAttribute('href', '/inventory/movements')
    expect(within(quickAccess).getByRole('link', { name: 'Préstamos' })).toHaveAttribute('href', '/inventory/loans')
    expect(within(quickAccess).getByRole('link', { name: 'Reportes' })).toHaveAttribute('href', '/inventory/reports')
  })

  it('keeps dashboard regions responsive and excludes functional coverage metrics', async () => {
    page()
    await screen.findByText('10')

    expect(screen.getByRole('navigation', { name: 'Accesos rápidos de inventario' })).toHaveClass(
      'min-[390px]:grid-cols-2',
      'min-[900px]:grid-cols-3',
      'min-[1200px]:grid-cols-5',
    )
    expect(screen.getByRole('region', { name: 'Indicadores de inventario' })).toHaveClass(
      'min-[900px]:grid-cols-4',
      'min-[1280px]:grid-cols-8',
    )
    expect(screen.getByRole('region', { name: 'Paneles principales de inventario' })).toHaveClass('min-[1200px]:grid-cols-12')
    expect(screen.getByRole('region', { name: 'Detalle del inventario' })).toHaveClass('min-[1200px]:grid-cols-12')
    expect(screen.queryByText(/Cobertura funcional|CRUD/)).not.toBeInTheDocument()
  })

  it('does not invent category or movement statistics when datasets are empty', async () => {
    page()
    expect(await screen.findByText('No hay artículos para distribuir.')).toBeInTheDocument()
    expect(screen.getByText('No hay movimientos registrados.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Gestionar artículos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Gestionar categorías' })).not.toBeInTheDocument()
  })

  it('shows inventory management actions only with the canonical capability', async () => {
    auth.user.permissionCodes = ['inv.inventory.read', 'inventory.item.manage']
    page()
    expect(await screen.findByRole('link', { name: 'Gestionar artículos' })).toHaveAttribute('href', '/inventory/items')
    expect(screen.getByRole('link', { name: 'Gestionar categorías' })).toHaveAttribute('href', '/inventory/categories')
  })

  it('shows an error state when the summary fails', async () => {
    vi.mocked(inventoryReportsService.summary).mockRejectedValueOnce(new Error('x'))
    page()
    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible cargar esta sección.')
  })
})
