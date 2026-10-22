import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdminDashboard } from '@/features/admin-dashboard'
import { httpClient } from '@/shared/api/httpClient'

vi.mock('@/shared/api/httpClient', () => ({ httpClient: { get: vi.fn() } }))

const data = {
  affiliates: { total: 12, active: 9, inactive: 3 },
  affiliateRequests: { pending: 4 },
  reservations: { total: 6, pending: 2, approved: 1, rejected: 0, cancelled: 0, confirmed: 2, completed: 1 },
  financial: { currency: 'CRC', totalIncome: '150000.00', totalExpenses: '40000.00', balance: '110000.00' },
  donations: { total: 7, confirmed: 6, cancelled: 1 },
  inventory: { totalItems: 20, lowStockItems: 3, outOfStockItems: 1, activeLoans: 4, overdueLoans: 2 },
  assemblies: { total: 7, scheduled: 2, in_progress: 1, completed: 4, cancelled: 0 },
  justifications: { pending: 2 },
}
const response = { metadata: { generatedAt: '2026-09-14T12:00:00.000Z', generatedBy: { id: 1, fullName: 'Admin' }, period: { from: null, to: null }, appliedFilters: {}, dataSource: ['AFFILIATE'], reportVersion: '1.0' }, data }

function renderDashboard(permissionCodes?: readonly string[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<MemoryRouter><QueryClientProvider client={client}><AdminDashboard permissionCodes={permissionCodes} /></QueryClientProvider></MemoryRouter>)
}

afterEach(() => vi.mocked(httpClient.get).mockReset())

describe('AdminDashboard', () => {
  it('shows compact loading placeholders while requesting indicators', () => {
    vi.mocked(httpClient.get).mockReturnValue(new Promise(() => {}))
    renderDashboard()
    expect(screen.getByRole('heading', { name: 'Panel administrativo' })).toBeInTheDocument()
    expect(screen.getByLabelText('Cargando indicadores administrativos')).toBeInTheDocument()
  })

  it('renders real institutional indicators and no simulated activity', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: response })
    renderDashboard()
    expect((await screen.findAllByText('Reservas pendientes')).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'Panel administrativo' })).toBeInTheDocument()
    expect(screen.getByText('Priorice la atención operativa y consulte el estado de los módulos autorizados.')).toBeInTheDocument()
    expect(screen.getAllByText('Solicitudes de afiliación').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Reservas pendientes').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Afiliados activos').length).toBeGreaterThan(0)
    expect(screen.getByText('Información no disponible')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Panorama institucional' })).toBeInTheDocument()
    expect(screen.getByText('Artículos registrados')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Requiere atención' })).toBeInTheDocument()
    expect(screen.getByText('Artículos agotados')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Actividad reciente' })).toBeInTheDocument()
    expect(screen.getByText('Actividad reciente no disponible')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(httpClient.get).toHaveBeenCalledWith('/admin-reports/dashboard')
  })

  it('prioritizes operational attention before key indicators and the institutional panorama', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: response })
    renderDashboard(['usr.user-requests.read', 'adm.requests.read', 'inv.inventory.read'])
    const attention = await screen.findByRole('heading', { name: 'Requiere atención' })
    const indicators = screen.getByRole('heading', { name: 'Solicitudes de cuenta', level: 2 })
    const panorama = screen.getByRole('heading', { name: 'Panorama institucional' })
    expect(attention.compareDocumentPosition(indicators) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(indicators.compareDocumentPosition(panorama) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('requests account-pending count only with its authorized capability', async () => {
    vi.mocked(httpClient.get).mockImplementation((url: string) => {
      if (url === '/admin-reports/dashboard') return Promise.resolve({ data: response })
      if (url === '/user-requests') return Promise.resolve({ data: { data: [], total: 6, page: 1, limit: 1 } })
      return Promise.reject(new Error('unexpected endpoint'))
    })
    renderDashboard(['usr.user-requests.read'])
    const card = await screen.findByRole('heading', { name: 'Solicitudes de cuenta', level: 2 })
    expect(within(card.closest('article')!).getByText('6')).toBeInTheDocument()
    expect(httpClient.get).toHaveBeenCalledWith('/user-requests', { params: { page: 1, limit: 1, status: 'PENDING' } })
  })

  it('filters quick actions by route capability', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: response })
    renderDashboard(['adm.requests.read', 'inv.inventory.read'])
    const navigation = await screen.findByRole('navigation', { name: 'Accesos rápidos administrativos' })
    expect(within(navigation).getByRole('link', { name: 'Revisar solicitudes de afiliación' })).toHaveAttribute('href', '/app/admin/requests')
    expect(within(navigation).getByRole('link', { name: 'Inventario' })).toHaveAttribute('href', '/inventory')
    expect(within(navigation).queryByRole('link', { name: 'Administrar usuarios' })).not.toBeInTheDocument()
  })

  it('does not expose unauthorized alert destinations', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: response })
    renderDashboard()
    const attention = (await screen.findByRole('heading', { name: 'Requiere atención' })).closest('section')!
    expect(within(attention).queryByRole('link', { name: /Solicitudes de afiliación/ })).not.toBeInTheDocument()
    expect(within(attention).queryByRole('link', { name: /Artículos con stock bajo/ })).not.toBeInTheDocument()
  })

  it('keeps the heading and explains the empty state when no administrative data exists', async () => {
    const emptyData = { ...data, affiliates: { total: 0, active: 0, inactive: 0 }, affiliateRequests: { pending: 0 }, reservations: { ...data.reservations, total: 0, pending: 0 }, donations: { total: 0, confirmed: 0, cancelled: 0 }, inventory: { ...data.inventory, totalItems: 0, lowStockItems: 0, outOfStockItems: 0, overdueLoans: 0 }, assemblies: { ...data.assemblies, total: 0, scheduled: 0, in_progress: 0 }, justifications: { pending: 0 } }
    vi.mocked(httpClient.get).mockResolvedValue({ data: { ...response, data: emptyData } })
    renderDashboard()
    expect(await screen.findByRole('heading', { name: 'Panel administrativo' })).toBeInTheDocument()
    expect(screen.getByText('Aún no hay datos administrativos para mostrar.')).toBeInTheDocument()
  })

  it('shows an accessible retry state when dashboard endpoint fails', async () => {
    vi.mocked(httpClient.get).mockRejectedValue(new Error('network'))
    renderDashboard()
    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible cargar los indicadores')
    expect(screen.getByRole('button', { name: /Reintentar/ })).toBeInTheDocument()
  })
})
