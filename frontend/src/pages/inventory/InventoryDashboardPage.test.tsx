import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InventoryDashboardPage } from './InventoryDashboardPage'
import { inventoryReportsService } from '../../services/inventoryReportsService'
import { inventoryAlertsService } from '../../services/inventoryAlertsService'
import { inventoryItemsService } from '../../services/inventoryItemsService'
import { inventoryMovementsService } from '../../services/inventoryMovementsService'
import type { InventoryItem } from '../../types/inventory'

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

const categoryPalette = [
  '#087E77', '#3266A8', '#D38C28', '#8556B0', '#CB6057',
  '#4893C1', '#6B9B38', '#A64F79', '#446A60', '#E0AE55', '#677B9C',
]

const elevenCategories = [
  'Papelería', 'Mobiliario', 'Equipo de cómputo', 'Herramientas', 'Limpieza', 'Seguridad',
  'Textiles', 'Alimentos', 'Medicamentos', 'Repuestos', 'Señalización',
]

function inventoryItems(quantities: Record<string, number>, reverse = false): InventoryItem[] {
  const items: InventoryItem[] = []
  Object.entries(quantities).forEach(([categoryName, total]) => {
    for (let unit = 0; unit < total; unit += 1) {
      const id = items.length + 1
      items.push({
        id,
        code: `ART-${id}`,
        name: `Artículo ${id}`,
        description: null,
        currentQuantity: unit + 1,
        minimumQuantity: 1,
        unit: 'unidad',
        location: null,
        status: 'ACTIVE',
        condition: 'GOOD',
        categoryId: 1,
        category: { id: 1, name: categoryName, isActive: true },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      })
    }
  })
  return reverse ? items.reverse() : items
}

function legendColor(categoryName: string): string {
  const label = screen.getByTitle(categoryName)
  const swatch = label.closest('li')?.firstElementChild as HTMLElement | null
  return swatch?.style.backgroundColor ?? ''
}

function normalizedColor(hex: string): string {
  const probe = document.createElement('span')
  probe.style.backgroundColor = hex
  return probe.style.backgroundColor
}

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

  it('assigns each of the eleven approved colors to eleven categories', async () => {
    vi.mocked(inventoryItemsService.list).mockResolvedValue({
      data: inventoryItems(Object.fromEntries(elevenCategories.map((name, index) => [name, index + 1]))),
      total: 66,
      page: 1,
      limit: 100,
    })
    page()
    await screen.findByTitle('Papelería')

    const colors = elevenCategories.map(legendColor)
    expect(new Set(colors).size).toBe(11)
    expect(colors.map(normalizedColor).sort()).toEqual(categoryPalette.map(normalizedColor).sort())
    expect(screen.getByText('66')).toBeInTheDocument()
  })

  it('keeps category colors stable when quantities and data order change', async () => {
    vi.mocked(inventoryItemsService.list).mockResolvedValue({
      data: inventoryItems(Object.fromEntries(elevenCategories.map((name, index) => [name, index + 1]))),
      total: 66,
      page: 1,
      limit: 100,
    })
    const firstRender = page()
    await screen.findByTitle('Papelería')
    const before = Object.fromEntries(elevenCategories.map(name => [name, legendColor(name)]))
    firstRender.unmount()

    vi.mocked(inventoryItemsService.list).mockResolvedValue({
      data: inventoryItems(Object.fromEntries(elevenCategories.map((name, index) => [name, 20 - index])), true),
      total: 179,
      page: 1,
      limit: 100,
    })
    page()
    await screen.findByTitle('Papelería')
    const after = Object.fromEntries(elevenCategories.map(name => [name, legendColor(name)]))

    expect(after).toEqual(before)
  })

  it('keeps colors deterministic when there are more categories than palette entries', async () => {
    const extraCategories = [...elevenCategories, 'Jardinería', 'Ferretería']
    vi.mocked(inventoryItemsService.list).mockResolvedValue({
      data: inventoryItems(Object.fromEntries(extraCategories.map(name => [name, 1]))),
      total: 13,
      page: 1,
      limit: 100,
    })
    page()
    await screen.findByTitle('Jardinería')

    const colors = extraCategories.map(legendColor)
    expect(colors).toHaveLength(13)
    colors.forEach(color => expect(categoryPalette.map(normalizedColor)).toContain(color))
  })
})
