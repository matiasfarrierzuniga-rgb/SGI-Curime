import { fireEvent, render, screen } from '@testing-library/react'
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

function renderRoute(path: string, role: string | null) {
  if (role !== null) {
    localStorage.setItem('sgi-curime-session', JSON.stringify({
      token: 'test-token',
      user: { id: 1, fullName: 'Ana Pérez', email: 'ana@example.test', status: 'ACTIVO', role },
    }))
    vi.spyOn(authService, 'me').mockResolvedValue({
      id: 1, fullName: 'Ana Pérez', email: 'ana@example.test', status: 'ACTIVO', role,
    })
  }

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}><ToastProvider><AuthProvider><MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter></AuthProvider></ToastProvider></QueryClientProvider>)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(usersService, 'list').mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 })
  vi.spyOn(affiliatesService, 'list').mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 })
  vi.mocked(rolesService.listActive).mockResolvedValue([])
  vi.mocked(auditLogsService.list).mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 })
  vi.mocked(inventoryReportsService.summary).mockResolvedValue({ activeItems: 0, lowStockCount: 0, outOfStockCount: 0, overdueLoans: 0 })
  vi.spyOn(userRequestsService, 'list').mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 })
  httpGet = vi.spyOn(httpClient, 'get').mockImplementation((url) => {
    if (url === '/affiliate-requests') return Promise.resolve({ data: { data: [], total: 0, page: 1, limit: 20 } })
    throw new Error(`Unexpected HTTP request in AppRoutes tests: ${url}`)
  })
})

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('AppRoutes capability deep links', () => {
  it('sends anonymous portal access to login', () => {
    renderRoute('/', null)

    expect(screen.getAllByRole('link', { name: 'Mi cuenta' })).not.toHaveLength(0)
    screen.getAllByRole('link', { name: 'Mi cuenta' }).forEach((link) => expect(link).toHaveAttribute('href', '/login'))
    expect(screen.queryByText('Ir al SGI')).not.toBeInTheDocument()
  })

  it('sends authenticated portal access back to the ERP', async () => {
    renderRoute('/', 'Administrador')

    expect(await screen.findAllByRole('link', { name: 'Mi panel' })).not.toHaveLength(0)
    screen.getAllByRole('link', { name: 'Mi panel' }).forEach((link) => expect(link).toHaveAttribute('href', '/app'))
  })

  it('redirects anonymous users from /app to login', () => {
    renderRoute('/app', null)

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Área de gestión' })).not.toBeInTheDocument()
  })

  it('redirects anonymous users from /admin/users to login before privileged content renders', () => {
    renderRoute('/admin/users', null)

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Usuarios' })).not.toBeInTheDocument()
  })

  it('renders /admin/users for administrators', async () => {
    renderRoute('/admin/users', 'Administrador')

    expect(await screen.findByRole('heading', { name: 'Administración de usuarios' })).toBeInTheDocument()
  })

  it('allows administrators to deep-link to audit logs', async () => {
    renderRoute('/admin/audit-logs', 'Administrador')

    expect(await screen.findByRole('heading', { name: 'Bitácora' })).toBeInTheDocument()
  })

  it('denies unprivileged deep-links to audit logs', async () => {
    renderRoute('/admin/audit-logs', 'Vecino/Afiliado')

    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).toBeInTheDocument()
  })

  it('allows authenticated users into /app', async () => {
    renderRoute('/app', 'Administrador')

    expect(await screen.findByRole('heading', { name: 'Hola, Ana' })).toBeInTheDocument()
  })

  it('preserves the authenticated session when returning to the public portal', async () => {
    renderRoute('/app', 'Administrador')

    await screen.findByRole('heading', { name: 'Hola, Ana' })
    fireEvent.click(screen.getAllByRole('link', { name: 'Ver sitio público' })[0])

    expect(await screen.findAllByRole('link', { name: 'Mi panel' })).not.toHaveLength(0)
  })

  it('clears the session and redirects logout to login', async () => {
    const sessionView = renderRoute('/app', 'Administrador')

    await screen.findByRole('heading', { name: 'Hola, Ana' })
    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar sesión' })[0])

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(localStorage.getItem('sgi-curime-session')).toBeNull()

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
})
