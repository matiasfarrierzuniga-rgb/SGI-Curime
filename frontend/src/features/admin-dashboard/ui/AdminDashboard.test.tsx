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
  return render(<MemoryRouter><QueryClientProvider client={client}><AdminDashboard permissionCodes={permissionCodes} userName="Ana Pérez" /></QueryClientProvider></MemoryRouter>)
}

afterEach(() => vi.mocked(httpClient.get).mockReset())

describe('AdminDashboard', () => {
  it('shows compact loading placeholders while requesting indicators', () => {
    vi.mocked(httpClient.get).mockReturnValue(new Promise(() => {}))
    renderDashboard()
    expect(screen.getByLabelText('Cargando indicadores administrativos')).toBeInTheDocument()
  })

  it('renders real institutional indicators and dashboard V2 composition', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: response })
    renderDashboard()
    expect((await screen.findAllByText('Reservas pendientes')).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'Buenos días, Ana' })).toBeInTheDocument()
    expect(screen.getByText('Aquí tiene el resumen de la gestión de la ADI Curime.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Atención requerida' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Accesos rápidos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Calendario institucional' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Resumen por módulo' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Estado de procesos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Próximas actividades' })).toBeInTheDocument()
    expect(screen.getAllByText('Reservas pendientes').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Afiliados activos').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Información no disponible').length).toBeGreaterThan(0)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(httpClient.get).toHaveBeenCalledWith('/admin-reports/dashboard')
  })

  it('requests account-pending count only with its authorized capability', async () => {
    vi.mocked(httpClient.get).mockImplementation((url: string) => {
      if (url === '/admin-reports/dashboard') return Promise.resolve({ data: response })
      if (url === '/user-requests') return Promise.resolve({ data: { data: [], total: 6, page: 1, limit: 1 } })
      return Promise.reject(new Error('unexpected endpoint'))
    })
    renderDashboard(['usr.user-requests.read'])
    const card = await screen.findByRole('heading', { name: 'Solicitudes pendientes', level: 2 })
    expect(within(card.closest('article')!).getByText('6')).toBeInTheDocument()
    expect(httpClient.get).toHaveBeenCalledWith('/user-requests', { params: { page: 1, limit: 1, status: 'PENDING' } })
  })

  it('filters quick actions by route capability', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: response })
    renderDashboard(['adm.requests.read', 'inv.inventory.read'])
    const navigation = await screen.findByRole('navigation', { name: 'Accesos rápidos administrativos' })
    expect(within(navigation).getByRole('link', { name: 'Inventario' })).toHaveAttribute('href', '/inventory')
    expect(within(navigation).getByRole('link', { name: 'Ver reportes' })).toHaveAttribute('href', '/inventory/reports')
    expect(within(navigation).queryByRole('link', { name: 'Administrar usuarios' })).not.toBeInTheDocument()
  })

  it('marks real authorized reservations, assemblies and public events by category on the same Costa Rica day', async () => {
    vi.mocked(httpClient.get).mockImplementation((url: string) => {
      if (url === '/admin-reports/dashboard') return Promise.resolve({ data: response })
      if (url === '/public/events') return Promise.resolve({ data: [{ publicId: 'event-1', title: 'Evento público', summary: 'Resumen', description: null, startAt: '2026-10-07T18:00:00.000Z', endAt: null, location: null, status: 'SCHEDULED' }] })
      if (url === '/reservations') return Promise.resolve({ data: { data: [{ id: 1, resourceId: 1, resource: { id: 1, name: 'Salón', location: null, pricingType: 'FREE', price: null, currency: 'CRC' }, requesterUserId: 1, requester: { id: 1, fullName: 'Ana', email: 'ana@example.com' }, eventId: null, event: null, startAt: '2026-10-07T16:00:00.000Z', endAt: '2026-10-07T18:00:00.000Z', purpose: 'Actividad', estimatedAttendees: null, notes: null, status: 'CONFIRMED', approvedAt: null, approvedById: null, approvedBy: null, rejectionReason: null, cancelledAt: null, createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z', financialCharge: null }], total: 1, page: 1, limit: 100 } })
      if (url === '/assemblies') return Promise.resolve({ data: { data: [{ id: 1, title: 'Asamblea', type: null, date: '2026-10-07T19:00:00.000Z', place: 'Salón', description: null, status: 'SCHEDULED', quorumType: null, quorumValue: null, convocationsLockedAt: null }] } })
      return Promise.reject(new Error(`unexpected endpoint ${url}`))
    })
    renderDashboard(['res.reservations.read', 'adm.assemblies.read'])
    expect(await screen.findByRole('gridcell', { name: /3 actividades: Reservas, Asambleas, Eventos/ })).toBeInTheDocument()
    expect(httpClient.get).toHaveBeenCalledWith('/reservations', { params: expect.objectContaining({ page: 1, limit: 100 }) })
    expect(httpClient.get).toHaveBeenCalledWith('/assemblies', { params: { page: 1, limit: 100 } })
  })

  it('shows an accessible retry state when dashboard endpoint fails', async () => {
    vi.mocked(httpClient.get).mockRejectedValue(new Error('network'))
    renderDashboard()
    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible cargar los indicadores')
    expect(screen.getByRole('button', { name: /Reintentar/ })).toBeInTheDocument()
  })
})
