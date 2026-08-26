import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { authService, AuthProvider } from '@/features/auth'
import { auditLogsService } from '@/services/auditLogsService'
import { ToastProvider } from '@/shared/ui/Toast'
import { AppRoutes } from './AppRoutes'

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
  vi.spyOn(auditLogsService, 'list').mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 })
  return render(<QueryClientProvider client={queryClient}><ToastProvider><AuthProvider><MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter></AuthProvider></ToastProvider></QueryClientProvider>)
}

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('AppRoutes capability deep links', () => {
  it('sends anonymous portal access to login', () => {
    renderRoute('/', null)

    expect(screen.getAllByRole('link', { name: 'Ir al SGI' })).not.toHaveLength(0)
    screen.getAllByRole('link', { name: 'Ir al SGI' }).forEach((link) => expect(link).toHaveAttribute('href', '/login'))
  })

  it('sends authenticated portal access back to the ERP', async () => {
    renderRoute('/', 'Administrador')

    expect(await screen.findAllByRole('link', { name: 'Volver al SGI' })).not.toHaveLength(0)
    screen.getAllByRole('link', { name: 'Volver al SGI' }).forEach((link) => expect(link).toHaveAttribute('href', '/app'))
  })

  it('redirects anonymous users from /app to login', () => {
    renderRoute('/app', null)

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Área de gestión' })).not.toBeInTheDocument()
  })

  it('redirects anonymous users from /app/users to login before privileged content renders', () => {
    renderRoute('/app/users', null)

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Usuarios' })).not.toBeInTheDocument()
  })

  it('renders /app/users for administrators', async () => {
    renderRoute('/app/users', 'Administrador')

    expect(await screen.findByRole('heading', { name: 'Usuarios' })).toBeInTheDocument()
  })

  it('allows authenticated users into /app', async () => {
    renderRoute('/app', 'Administrador')

    expect(await screen.findByRole('heading', { name: 'Área de gestión' })).toBeInTheDocument()
  })

  it('preserves the authenticated session when returning to the public portal', async () => {
    renderRoute('/app', 'Administrador')

    await screen.findByRole('heading', { name: 'Área de gestión' })
    fireEvent.click(screen.getByRole('link', { name: 'Portal público' }))

    expect(await screen.findAllByRole('link', { name: 'Volver al SGI' })).not.toHaveLength(0)
  })

  it('clears the session and redirects logout to login', async () => {
    const sessionView = renderRoute('/app', 'Administrador')

    await screen.findByRole('heading', { name: 'Área de gestión' })
    fireEvent.click(screen.getByRole('button', { name: 'Menú de usuario de Ana Pérez' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }))

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(localStorage.getItem('sgi-curime-session')).toBeNull()

    sessionView.unmount()
    const appView = renderRoute('/app', null)
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()

    appView.unmount()
    renderRoute('/app/users', null)
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('redirects basic authenticated users from /app/users to 403', async () => {
    renderRoute('/app/users', 'Vecino/Afiliado')

    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Usuarios' })).not.toBeInTheDocument()
  })

  it('redirects unknown roles from /app/admin/affiliates to 403', async () => {
    renderRoute('/app/admin/affiliates', 'Rol desconocido')

    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Afiliados' })).not.toBeInTheDocument()
  })

  it('renders AuditLogsPage from /app/audit-logs for aud.logs.read', async () => {
    renderRoute('/app/audit-logs', 'Administrador')

    expect(await screen.findByRole('heading', { name: 'Bitácora' })).toBeInTheDocument()
  })

  it('redirects authenticated users without aud.logs.read from /app/audit-logs to 403', async () => {
    renderRoute('/app/audit-logs', 'Vecino/Afiliado')

    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Bitácora' })).not.toBeInTheDocument()
  })

  it('redirects anonymous users from /app/audit-logs to login', () => {
    renderRoute('/app/audit-logs', null)

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Bitácora' })).not.toBeInTheDocument()
  })
})
