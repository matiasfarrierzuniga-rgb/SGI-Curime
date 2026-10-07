import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authService, AuthProvider } from '@/features/auth'
import { affiliatesService } from '@/features/affiliates'
import { usersService } from '@/features/users'
import { rolesService } from '@/features/roles'
import { auditLogsService } from '@/services/auditLogsService'
import { inventoryReportsService } from '@/services/inventoryReportsService'
import { httpClient } from '@/shared/api/httpClient'
import { userRequestsService } from '@/features/user-requests'
import { ACCESS_CAPABILITIES } from '@/shared/security/access'
import { AppRoutes } from './AppRoutes'
import { ToastProvider } from '@/shared/ui/Toast'

vi.mock('@/features/roles', () => ({
  rolesService: { listActive: vi.fn() },
}))

vi.mock('@/services/auditLogsService', () => ({
  auditLogsService: { list: vi.fn(), get: vi.fn() },
}))

vi.mock('@/services/inventoryReportsService', () => ({
  inventoryReportsService: { summary: vi.fn() },
}))

let httpGet: ReturnType<typeof vi.spyOn>

const ADMIN_PERMISSION_CODES = [...ACCESS_CAPABILITIES]
const TREASURER_PERMISSION_CODES = ['erp.dashboard.read', 'fin.charges.read', 'fin.payments.record', 'fin.movements.read', 'fin.movements.create', 'fin.dinadeco.read', 'don.donations.read', 'don.donations.create', 'don.donations.update', 'don.donations.cancel']
const INVENTORY_MANAGER_PERMISSION_CODES = ['erp.dashboard.read', 'usr.profile.read', 'inv.inventory.read']

function permissionCodesFor(role: string, canAccessErp: boolean) {
  if (!canAccessErp) return []
  if (role === 'Administrador') return ADMIN_PERMISSION_CODES
  if (role === 'Tesorero') return TREASURER_PERMISSION_CODES
  if (role === 'Gestor de Inventario') return INVENTORY_MANAGER_PERMISSION_CODES
  return ['erp.dashboard.read']
}

function renderRoute(path: string, role: string | null, canAccessErp = role !== null) {
  if (role !== null) {
    const permissionCodes = permissionCodesFor(role, canAccessErp)
    sessionStorage.setItem('sgi-curime-session', JSON.stringify({
      token: 'test-token',
      user: { id: 1, fullName: 'Ana Pérez', email: 'ana@example.test', status: 'ACTIVE', role, canAccessErp, permissionCodes },
    }))
    vi.spyOn(authService, 'me').mockResolvedValue({
      id: 1, fullName: 'Ana Pérez', email: 'ana@example.test', status: 'ACTIVE', role, canAccessErp, permissionCodes,
    })
  }

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}><ToastProvider><AuthProvider><MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter></AuthProvider></ToastProvider></QueryClientProvider>)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(authService, 'logout').mockResolvedValue({ message: 'Logged out' })
  vi.spyOn(usersService, 'list').mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 })
  vi.spyOn(affiliatesService, 'list').mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 })
  vi.mocked(rolesService.listActive).mockResolvedValue([])
  vi.mocked(auditLogsService.list).mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 })
  vi.mocked(inventoryReportsService.summary).mockResolvedValue({ activeItems: 0, lowStockCount: 0, outOfStockCount: 0, overdueLoans: 0 })
  vi.spyOn(userRequestsService, 'list').mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 })
  httpGet = vi.spyOn(httpClient, 'get').mockImplementation((url) => {
    if (url === '/affiliate-requests') return Promise.resolve({ data: { data: [], total: 0, page: 1, limit: 20 } })
    if (url === '/events') return Promise.resolve({ data: [] })
    if (url === '/public/events') return Promise.resolve({ data: [] })
    if (url === '/financial/charges') return Promise.resolve({ data: { data: [], total: 0, page: 1, limit: 20 } })
    if (url === '/financial/movements') return Promise.resolve({ data: { data: [], total: 0, page: 1, limit: 20 } })
    if (url === '/financial/movements/summary') return Promise.resolve({ data: { currency: 'CRC', totalIncome: '0.00', totalExpenses: '0.00', balance: '0.00', incomeCount: 0, expenseCount: 0, movementCount: 0, incomeAverage: '0.00', expenseAverage: '0.00', bySource: [], confirmedPayments: { total: '0.00', count: 0, byMethod: [] } } })
    if (url === '/financial/reports/dinadeco/annual') return Promise.resolve({ data: responseForDinadeco() })
    if (url === '/admin-reports/affiliates') return Promise.resolve({ data: { metadata: { generatedAt: new Date().toISOString(), generatedBy: null, period: { from: null, to: null }, appliedFilters: {}, dataSource: 'AFFILIATE', reportVersion: '1.0' }, data: { data: [], total: 0, page: 1, limit: 20 } } })
    if (url === '/donations') return Promise.resolve({ data: { data: [], total: 0, page: 1, limit: 20 } })
    if (url === '/volunteering/opportunities') return Promise.resolve({ data: { data: [], total: 0, page: 1, limit: 20 } })
    if (url === '/institutional-profile') return Promise.resolve({ data: emptyInstitutionalProfile() })
    throw new Error(`Unexpected HTTP request in AppRoutes tests: ${url}`)
  })
})

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe('AppRoutes capability deep links', () => {
  it('sends anonymous portal access to login', () => {
    renderRoute('/', null)

    expect(screen.getAllByRole('link', { name: 'Iniciar sesión' })).not.toHaveLength(0)
    screen.getAllByRole('link', { name: 'Iniciar sesión' }).forEach((link) => expect(link).toHaveAttribute('href', '/login'))
  })

  it('sends authenticated portal access to the panel', async () => {
    renderRoute('/', 'Administrador')

    expect(await screen.findAllByRole('link', { name: 'Ir al panel' })).not.toHaveLength(0)
    screen.getAllByRole('link', { name: 'Ir al panel' }).forEach((link) => expect(link).toHaveAttribute('href', '/app'))
    expect(screen.getAllByRole('button', { name: 'Cerrar sesión' })).toHaveLength(3)
    expect(screen.queryByRole('link', { name: 'Solicitar una cuenta' })).not.toBeInTheDocument()
  })

  it('shows services and logout, but no panel or account request, to a general account', async () => {
    renderRoute('/servicios', 'Subscription_L1', false)

    expect(await screen.findByRole('heading', { name: 'Servicios' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Ver servicios' })).not.toHaveLength(0)
    expect(screen.queryByRole('link', { name: 'Ir al panel' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Solicitar una cuenta' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Cerrar sesión' })).toHaveLength(3)
  })

  it('logs out a general account from the mobile public menu', async () => {
    renderRoute('/servicios', 'Subscription_L1', false)

    await screen.findByRole('heading', { name: 'Servicios' })
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú de navegación' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar sesión' })[0])

    await waitFor(() => expect(sessionStorage.getItem('sgi-curime-session')).toBeNull())
    expect(screen.getAllByRole('link', { name: 'Iniciar sesión' })).not.toHaveLength(0)
    expect(screen.getAllByRole('link', { name: 'Solicitar una cuenta' })).not.toHaveLength(0)
  })

  it('redirects anonymous users from /app to login', () => {
    renderRoute('/app', null)

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Área de gestión' })).not.toBeInTheDocument()
  })

  it('redirects a general account deep link to services without rendering internal navigation', async () => {
    renderRoute('/app/admin/affiliates', 'Subscription_L1', false)

    expect(await screen.findByRole('heading', { name: 'Servicios' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Ir al panel' })).not.toBeInTheDocument()
    expect(screen.queryByText('Navegación móvil')).not.toBeInTheDocument()
  })

  it('redirects anonymous users from /admin/users to login before privileged content renders', () => {
    renderRoute('/admin/users', null)

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Usuarios' })).not.toBeInTheDocument()
  })

  it('renders /admin/users for administrators', async () => {
    renderRoute('/admin/users', 'Administrador')

    expect(await screen.findByRole('heading', { name: 'Usuarios' })).toBeInTheDocument()
  })

  it('allows administrators to open the affiliate report', async () => {
    renderRoute('/app/admin/reports', 'Administrador')

    expect(await screen.findByRole('heading', { name: 'Reporte de afiliados' })).toBeInTheDocument()
    expect(await screen.findByText('No hay afiliados para mostrar')).toBeInTheDocument()
  })

  it('denies the affiliate report to roles without affiliate read access', async () => {
    renderRoute('/app/admin/reports', 'Vecino/Afiliado')

    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).toBeInTheDocument()
  })

  it('allows administrators to deep-link to audit logs', async () => {
    renderRoute('/admin/audit-logs', 'Administrador')

    expect(await screen.findByRole('heading', { name: 'Bitácora' })).toBeInTheDocument()
  })

  it('allows administrators into event management', async () => {
    renderRoute('/app/events', 'Administrador')

    expect(await screen.findByRole('heading', { name: 'Eventos' })).toBeInTheDocument()
    expect(await screen.findByText('No hay eventos registrados')).toBeInTheDocument()
  })

  it('denies users without event management capability', async () => {
    renderRoute('/app/events', 'Vecino/Afiliado')

    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).toBeInTheDocument()
  })

  it('denies unprivileged deep-links to audit logs', async () => {
    renderRoute('/admin/audit-logs', 'Vecino/Afiliado')

    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).toBeInTheDocument()
  })

  it('allows authenticated users into /app', async () => {
    renderRoute('/app', 'Administrador')

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('renders profile inside the ERP shell while preserving the public profile route', async () => {
    const user = { id: 1, fullName: 'Ana Pérez', email: 'ana@example.test', status: 'ACTIVE', role: 'Administrador', canAccessErp: true, permissionCodes: ['erp.dashboard.read'] }
    sessionStorage.setItem('sgi-curime-session', JSON.stringify({ token: 'test-token', user }))
    vi.spyOn(authService, 'me').mockResolvedValue(user)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const erpView = render(<QueryClientProvider client={queryClient}><ToastProvider><AuthProvider><MemoryRouter initialEntries={['/app/profile']}><AppRoutes /></MemoryRouter></AuthProvider></ToastProvider></QueryClientProvider>)

    expect(await screen.findByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument()
    expect(document.getElementById('erp-content')).toBeInTheDocument()
    expect(document.getElementById('public-content')).not.toBeInTheDocument()

    erpView.unmount()
    renderRoute('/profile', 'Vecino/Afiliado', false)
    expect(await screen.findByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument()
    expect(document.getElementById('public-content')).toBeInTheDocument()
  })

  it('preserves the authenticated session when returning to the public portal', async () => {
    renderRoute('/app', 'Administrador')

    await screen.findByRole('heading', { name: 'Dashboard' })
    fireEvent.click(screen.getAllByRole('link', { name: 'Ver sitio público' })[0])

    expect(await screen.findAllByRole('link', { name: 'Ir al panel' })).not.toHaveLength(0)
  })

  it('clears the session and redirects logout to login', async () => {
    const sessionView = renderRoute('/app', 'Administrador')

    await screen.findByRole('heading', { name: 'Dashboard' })
    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar sesión' })[0])

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    await waitFor(() => expect(sessionStorage.getItem('sgi-curime-session')).toBeNull())

    sessionView.unmount()
    const appView = renderRoute('/app', null)
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()

    appView.unmount()
    renderRoute('/admin/users', null)
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('redirects basic authenticated users from /admin/users to 403', async () => {
    renderRoute('/admin/users', 'Vecino/Afiliado')

    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Administración de usuarios' })).not.toBeInTheDocument()
  })

  it('redirects unknown roles from /app/admin/affiliates to 403', async () => {
    renderRoute('/app/admin/affiliates', 'Rol desconocido')

    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Afiliados' })).not.toBeInTheDocument()
  })

  it('redirects anonymous users from /app/admin/affiliates to login', () => {
    renderRoute('/app/admin/affiliates', null)

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Afiliados' })).not.toBeInTheDocument()
  })

  it('renders the real affiliates page for administrators without HTTP requests', async () => {
    renderRoute('/app/admin/affiliates', 'Administrador')

    expect(await screen.findByRole('heading', { name: 'Afiliados' })).toBeInTheDocument()
    expect(await screen.findByText('No hay afiliados')).toBeInTheDocument()
    expect(affiliatesService.list).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 20 }))
  })

  it('redirects authenticated users without affiliate capability to 403', async () => {
    renderRoute('/app/admin/affiliates', 'Vecino/Afiliado')

    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).toBeInTheDocument()
    expect(screen.queryByText('No hay afiliados')).not.toBeInTheDocument()
  })

  it('redirects anonymous users from affiliate requests to login', () => {
    renderRoute('/app/admin/requests', null)

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Solicitudes de afiliación' })).not.toBeInTheDocument()
  })

  it('renders the real affiliate requests page for administrators without HTTP requests', async () => {
    renderRoute('/app/admin/requests', 'Administrador')

    expect(await screen.findByRole('heading', { name: 'Solicitudes de afiliación' })).toBeInTheDocument()
    expect(await screen.findByText('No hay solicitudes de afiliación')).toBeInTheDocument()
    expect(httpGet).toHaveBeenCalledWith('/affiliate-requests', { params: expect.objectContaining({ page: 1, limit: 20 }) })
  })

  it('redirects users without requests capability to 403', async () => {
    renderRoute('/app/admin/requests', 'Vecino/Afiliado')

    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Solicitudes de afiliación' })).not.toBeInTheDocument()
  })

  it('default-denies unknown roles from affiliate requests', async () => {
    renderRoute('/app/admin/requests', 'Rol desconocido')

    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).toBeInTheDocument()
  })

  it('keeps legacy user requests separate from affiliate requests', async () => {
    renderRoute('/admin/user-requests', 'Administrador')

    expect(await screen.findByRole('heading', { name: 'Solicitudes de registro' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Solicitudes de afiliación' })).not.toBeInTheDocument()
  })

  it('redirects anonymous users from /app/financial to login', () => {
    renderRoute('/app/financial', null)

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Financiero' })).not.toBeInTheDocument()
  })

  it('redirects anonymous users from /app/donations to login', () => {
    renderRoute('/app/donations', null)

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Donaciones' })).not.toBeInTheDocument()
  })

  it('renders donations for users with the donations read capability', async () => {
    renderRoute('/app/donations', 'Administrador')

    expect(await screen.findByRole('heading', { name: 'Donaciones' })).toBeInTheDocument()
    expect(await screen.findByText('No existen donaciones registradas')).toBeInTheDocument()
    expect(httpGet).toHaveBeenCalledWith('/donations', { params: expect.objectContaining({ page: 1, limit: 20 }) })
  })

  it('redirects users without donations read capability to 403', async () => {
    renderRoute('/app/donations', 'Vecino/Afiliado')

    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Donaciones' })).not.toBeInTheDocument()
  })

  it('renders the real financial page for treasurers using the financial API', async () => {
    renderRoute('/app/financial', 'Tesorero')

    expect(await screen.findByRole('heading', { name: 'Cargos de reservas' })).toBeInTheDocument()
    expect(await screen.findByText('No hay cargos financieros')).toBeInTheDocument()
    expect(httpGet).toHaveBeenCalledWith('/financial/charges', { params: expect.objectContaining({ page: 1, limit: 20 }) })
  })

  it('renders the real financial page for administrators', async () => {
    renderRoute('/app/financial', 'Administrador')

    expect(await screen.findByRole('heading', { name: 'Cargos de reservas' })).toBeInTheDocument()
    expect(await screen.findByText('No hay cargos financieros')).toBeInTheDocument()
  })

  it('redirects users without financial capability to 403', async () => {
    renderRoute('/app/financial', 'Vecino/Afiliado')

    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).toBeInTheDocument()
    expect(screen.queryByText('No hay cargos financieros')).not.toBeInTheDocument()
  })

  it('default-denies unknown roles from /app/financial', async () => {
    renderRoute('/app/financial', 'Rol desconocido')

    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).toBeInTheDocument()
  })

  it('preserves the financial movements route for treasurers', async () => {
    renderRoute('/app/financial/movements', 'Tesorero')

    expect(await screen.findByRole('heading', { name: 'Reporte operativo financiero' })).toBeInTheDocument()
    expect(await screen.findByText('No hay movimientos financieros')).toBeInTheDocument()
    expect(httpGet).toHaveBeenCalledWith('/financial/movements', { params: expect.objectContaining({ page: 1, limit: 20 }) })
  })

  it('denies financial movements to users without its read capability', async () => {
    renderRoute('/app/financial/movements', 'Vecino/Afiliado')

    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).toBeInTheDocument()
  })

  it('protects and renders the DINADECO report route by capability', async () => {
    renderRoute('/app/financial/dinadeco', 'Tesorero')
    expect(await screen.findByRole('heading', { name: 'Informe Económico DINADECO' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Preparación del FIE' })).toBeInTheDocument()
    expect(httpGet).toHaveBeenCalledWith('/financial/reports/dinadeco/annual', { params: { year: new Date().getFullYear() } })
  })

  it('denies the DINADECO report to roles without capability', async () => {
    renderRoute('/app/financial/dinadeco', 'Gestor de Inventario')
    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).toBeInTheDocument()
  })

  it('protects the institutional profile route for Administrador only', async () => {
    renderRoute('/app/admin/institutional-profile', 'Administrador')
    expect(await screen.findByRole('heading', { name: 'Perfil institucional' })).toBeInTheDocument()
    expect(httpGet).toHaveBeenCalledWith('/institutional-profile')
  })

  it('denies the institutional profile route to Tesorero', async () => {
    renderRoute('/app/admin/institutional-profile', 'Tesorero')
    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).toBeInTheDocument()
  })

  it('allows administrators to deep-link to volunteering opportunities through the HTTP client', async () => {
    renderRoute('/app/admin/volunteering', 'Administrador')

    expect(await screen.findByRole('heading', { name: 'Voluntariado' })).toBeInTheDocument()
    expect(await screen.findByText('No hay oportunidades registradas')).toBeInTheDocument()
    expect(httpGet).toHaveBeenCalledWith('/volunteering/opportunities', { params: { page: 1, limit: 20 } })
  })

  it('denies volunteering opportunity deep links without read capability', async () => {
    renderRoute('/app/admin/volunteering', 'Vecino/Afiliado')

    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Voluntariado' })).not.toBeInTheDocument()
  })
})

function emptyInstitutionalProfile() {
  return { id: 1, legalName: null, legalIdentification: null, dinadecoRegistrationCode: null, dinadecoRegion: null, organizationType: null, province: null, canton: null, district: null, locality: null, correspondenceAddress: null, phone: null, telefax: null, email: null, createdAt: '2026-09-20T00:00:00.000Z', updatedAt: '2026-09-20T00:00:00.000Z' }
}

function responseForDinadeco() {
  const year = new Date().getFullYear()
  return {
    metadata: { generatedAt: new Date().toISOString(), generatedBy: { id: 1, fullName: 'Ana Pérez' }, period: { from: `${year}-01-01T00:00:00.000Z`, to: `${year + 1}-01-01T00:00:00.000Z` }, appliedFilters: { year }, dataSource: 'FINANCIAL_MOVEMENT', reportVersion: '1.0' },
    data: {
      year, currency: 'CRC', openingBalance: '0.00', income: { total: '0.00', count: 0, bySource: {} }, expenses: { total: '0.00', count: 0, bySource: {} }, netMovement: '0.00', closingBalance: '0.00', movementCount: 0,
      institutionalProfile: { legalName: null, legalIdentification: null, dinadecoRegistrationCode: null, dinadecoRegion: null, organizationType: null, province: null, canton: null, district: null, locality: null, correspondenceAddress: null, phone: null, telefax: null, email: null },
      fie: {
        entries: [], exits: [],
        capacity: { entryCount: 0, exitCount: 0, entryCapacity: 15, exitCapacity: 15, entryOverflow: false, exitOverflow: false },
        totalIncomePlusOpeningBalance: '0.00', totalExpensesPlusClosingBalance: '0.00',
      },
    },
  }
}
