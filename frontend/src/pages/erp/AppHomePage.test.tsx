import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppHomePage } from './AppHomePage'
import { inventoryReportsService } from '@/services/inventoryReportsService'

const auth = vi.hoisted(() => ({ user: { fullName: 'Ana Pérez', role: 'Administrador' } }))
vi.mock('@/features/auth', () => ({ useAuth: () => auth }))
vi.mock('@/services/inventoryReportsService', () => ({ inventoryReportsService: { summary: vi.fn() } }))

const summary = { totalItems: 12, activeItems: 10, inactiveItems: 2, totalCategories: 4, lowStockCount: 2, outOfStockCount: 1, activeLoans: 3, overdueLoans: 1 }

describe('AppHomePage', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(inventoryReportsService.summary).mockResolvedValue(summary) })

  it('renders real inventory metrics and administrative quick actions for administrators', async () => {
    auth.user = { fullName: 'Ana Pérez', role: 'Administrador' }
    render(<MemoryRouter><AppHomePage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Hola, Ana' })).toBeInTheDocument()
    expect(await screen.findByText('Artículos activos')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Gestionar usuarios/ })).toHaveAttribute('href', '/admin/users')
    expect(screen.getByRole('link', { name: /Revisar solicitudes/ })).toHaveAttribute('href', '/app/admin/requests')
    expect(screen.getByRole('link', { name: /Consultar bitácora/ })).toHaveAttribute('href', '/admin/audit-logs')
    expect(screen.getByRole('link', { name: /Solicitar una reserva/ })).toHaveAttribute('href', '/app/reservations/new')
    expect(screen.queryByText(/Módulo en desarrollo/i)).not.toBeInTheDocument()
  })

  it('does not expose administrative actions to inventory managers', async () => {
    auth.user = { fullName: 'Luis Mora', role: 'Gestor de Inventario' }
    render(<MemoryRouter><AppHomePage /></MemoryRouter>)
    expect(await screen.findByText('Artículos activos')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Abrir inventario/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Gestionar usuarios|Revisar solicitudes|Consultar bitácora/ })).not.toBeInTheDocument()
  })

  it('shows a clear set of real account actions to community users', () => {
    auth.user = { fullName: 'María Solano', role: 'Vecino/Afiliado' }
    render(<MemoryRouter><AppHomePage /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /Solicitar una reserva/ })).toHaveAttribute('href', '/app/reservations/new')
    expect(screen.getByRole('link', { name: /Enviar justificación/ })).toHaveAttribute('href', '/app/affiliate/absence-justifications/new')
    expect(screen.getByRole('link', { name: /Mis justificaciones/ })).toHaveAttribute('href', '/app/affiliate/justifications')
    expect(screen.getByRole('link', { name: 'Mi perfil' })).toHaveAttribute('href', '/profile')
    expect(screen.getByRole('link', { name: 'Afiliación' })).toHaveAttribute('href', '/afiliacion')
    expect(screen.getByRole('link', { name: 'Eventos' })).toHaveAttribute('href', '/eventos')
    expect(screen.queryByRole('link', { name: /Gestionar usuarios|Revisar solicitudes|Consultar bitácora/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Accesos rápidos' })).not.toBeInTheDocument()
    expect(inventoryReportsService.summary).not.toHaveBeenCalled()
  })

  it('preserves financial actions for treasurers without community-only links', () => {
    auth.user = { fullName: 'Carlos Ruiz', role: 'Tesorero' }
    render(<MemoryRouter><AppHomePage /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /Cargos financieros/ })).toHaveAttribute('href', '/app/financial')
    expect(screen.getByRole('link', { name: /Movimientos financieros/ })).toHaveAttribute('href', '/app/financial/movements')
    expect(screen.queryByRole('link', { name: 'Afiliación' })).not.toBeInTheDocument()
  })
})
