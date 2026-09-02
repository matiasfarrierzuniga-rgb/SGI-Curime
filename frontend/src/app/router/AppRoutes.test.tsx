import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authService, AuthProvider } from '@/features/auth'
import { rolesService } from '@/features/roles'
import { auditLogsService } from '@/services/auditLogsService'
import { inventoryReportsService } from '@/services/inventoryReportsService'
import { httpClient } from '@/shared/api/httpClient'
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
  vi.mocked(rolesService.listActive).mockResolvedValue([])
  vi.mocked(auditLogsService.list).mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 })
  vi.mocked(inventoryReportsService.summary).mockResolvedValue({ activeItems: 0, lowStockCount: 0, outOfStockCount: 0, overdueLoans: 0 })
  vi.spyOn(httpClient, 'get').mockResolvedValue({ data: { data: [], total: 0, page: 1, limit: 10 } })
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

  it('sends administrative portal access back to the ERP', async () => {
    renderRoute('/', 'Administrador')

    expect(await screen.findAllByRole('link', { name: 'Mi cuenta' })).not.toHaveLength(0)
    screen.getAllByRole('link', { name: 'Mi cuenta' }).forEach((link) => expect(link).toHaveAttribute('href', '/app'))
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

  it('redirects unprivileged deep-links to the personal area', async () => {
    renderRoute('/admin/audit-logs', 'Vecino/Afiliado')

    expect(await screen.findByRole('heading', { name: 'Hola, Ana' })).toBeInTheDocument()
  })

  it('allows authenticated users into /app', async () => {
    renderRoute('/app', 'Administrador')

    expect(await screen.findByRole('heading', { name: 'Hola, Ana' })).toBeInTheDocument()
  })

  it('preserves the authenticated session when returning to the public portal', async () => {
    renderRoute('/app', 'Administrador')

    await screen.findByRole('heading', { name: 'Hola, Ana' })
    fireEvent.click(screen.getAllByRole('link', { name: 'Ver sitio público' })[0])

    expect(await screen.findAllByRole('link', { name: 'Mi cuenta' })).not.toHaveLength(0)
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

  it('redirects legacy personal accounts away from ERP routes', async () => {
    renderRoute('/admin/users', 'Vecino/Afiliado')

    expect(await screen.findByRole('heading', { name: 'Hola, Ana' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Administración de usuarios' })).not.toBeInTheDocument()
  })

  it.each(['Usuario', 'Vecino/Afiliado', 'Tesorero'])('redirects %s from /app to Mi cuenta', async (role) => {
    renderRoute('/app', role)

    expect(await screen.findByRole('heading', { name: 'Hola, Ana' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Navegación de Mi cuenta' })).toBeInTheDocument()
    expect(screen.queryByText('Área de gestión')).not.toBeInTheDocument()
  })

  it('lets Usuario open Mi cuenta and the shared profile page', async () => {
    const accountView = renderRoute('/mi-cuenta', 'Usuario')
    expect(await screen.findByRole('heading', { name: 'Hola, Ana' })).toBeInTheDocument()
    accountView.unmount()

    renderRoute('/profile', 'Usuario')
    expect(await screen.findByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument()
  })

  it('redirects unknown roles from /app/admin/affiliates to 403', async () => {
    renderRoute('/app/admin/affiliates', 'Rol desconocido')

    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Afiliados' })).not.toBeInTheDocument()
  })
})
