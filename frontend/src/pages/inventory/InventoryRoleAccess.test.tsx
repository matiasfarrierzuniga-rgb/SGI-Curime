import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Navigate, Outlet } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '@/app/router/AppRoutes'
import { hasCapability, hasManagementCapabilities } from '@/shared/security/access'

const state = vi.hoisted(() => ({
  value: {
    user: null as { role: string; fullName: string } | null,
    token: 't',
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  },
}))

vi.mock('@/features/auth', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/auth')>()
  return {
    ...actual,
    useAuth: () => state.value,
    AuthProvider: ({ children }: { children: ReactNode }) => children,
    LoginPage: () => <h1>Iniciar sesión</h1>,
    ProtectedRoute: () => state.value.isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />,
    ManagementRoute: () => hasManagementCapabilities(state.value.user?.role) ? <Outlet /> : <Navigate to="/mi-cuenta" replace />,
    RoleRoute: ({ role, capability }: { role?: string | string[]; capability?: string }) => {
      const currentRole = state.value.user?.role
      const allowed = capability
        ? hasCapability(currentRole, capability)
        : Array.isArray(role) ? role.includes(currentRole ?? '') : currentRole === role
      return allowed ? <Outlet /> : <Navigate to="/403" replace />
    },
  }
})

vi.mock('../../services/inventoryReportsService', () => ({
  inventoryReportsService: {
    summary: vi.fn().mockResolvedValue({
      totalItems: 0,
      activeItems: 0,
      inactiveItems: 0,
      totalCategories: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      activeLoans: 0,
      overdueLoans: 0,
    }),
  },
}))

const renderAt = (path: string, role: string | null) => {
  state.value.user = role ? { role, fullName: 'Ana Pérez' } : null
  state.value.isAuthenticated = Boolean(role)
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

describe('Inventory route access by role', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows the Gestor de Inventario to open the inventory dashboard', async () => {
    renderAt('/inventory', 'Gestor de Inventario')
    expect(await screen.findByRole('heading', { name: 'Inventario' })).toBeInTheDocument()
  })

  it('allows the Administrador to open inventory routes', async () => {
    renderAt('/inventory', 'Administrador')
    expect(await screen.findByRole('heading', { name: 'Inventario' })).toBeInTheDocument()
  })

  it('redirects a non-management role from protected routes to Mi cuenta', async () => {
    renderAt('/inventory/items', 'Usuario')
    expect(await screen.findByRole('heading', { name: 'Hola, Ana' })).toBeInTheDocument()
    expect(screen.queryByText('Artículos')).not.toBeInTheDocument()
  })

  it('redirects unauthenticated users to login without exposing inventory pages', async () => {
    renderAt('/inventory/reports', null)
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.queryByText('Reportes de inventario')).not.toBeInTheDocument()
  })
})
