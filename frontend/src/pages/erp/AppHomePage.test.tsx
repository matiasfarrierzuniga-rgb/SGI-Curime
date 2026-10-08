import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppHomePage } from './AppHomePage'
import { inventoryReportsService } from '@/services/inventoryReportsService'

const auth = vi.hoisted(() => ({ user: {} as {
  fullName: string
  role: string
  affiliateId: string | null
  affiliateStatus: 'ACTIVE' | 'INACTIVE' | null
  permissionCodes: string[]
} }))
vi.mock('@/features/auth', () => ({ useAuth: () => auth }))
vi.mock('@/features/admin-dashboard', () => ({ AdminDashboard: () => <section><h2>Indicadores administrativos</h2><p>Afiliados activos</p></section> }))
vi.mock('@/services/inventoryReportsService', () => ({ inventoryReportsService: { summary: vi.fn() } }))

const summary = { totalItems: 12, activeItems: 10, inactiveItems: 2, totalCategories: 4, lowStockCount: 2, outOfStockCount: 1, activeLoans: 3, overdueLoans: 1 }

describe('AppHomePage', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(inventoryReportsService.summary).mockResolvedValue(summary) })

  it('renders V1 administrative dashboard without broad legacy quick actions', async () => {
    auth.user = { fullName: 'Ana Pérez', role: 'Administrador', affiliateId: null, affiliateStatus: null, permissionCodes: ['usr.users.read', 'usr.user-requests.read'] }
    render(<MemoryRouter><AppHomePage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(await screen.findByText('Afiliados activos')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Indicadores administrativos' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Accesos rápidos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Gestionar usuarios|Revisar solicitudes|Consultar bitácora|Movimientos financieros/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/Módulo en desarrollo/i)).not.toBeInTheDocument()
    expect(inventoryReportsService.summary).not.toHaveBeenCalled()
    expect(screen.getByRole('link', { name: /Solicitar una reserva/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Enviar justificación/ })).not.toBeInTheDocument()
  })

  it('keeps inventory summary without broad legacy action grid', async () => {
    auth.user = { fullName: 'Luis Mora', role: 'Gestor de Inventario', affiliateId: null, affiliateStatus: 'ACTIVE', permissionCodes: ['inv.inventory.read'] }
    render(<MemoryRouter><AppHomePage /></MemoryRouter>)
    expect(await screen.findByText('Artículos activos')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Accesos rápidos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Abrir inventario|Gestionar usuarios|Revisar solicitudes|Consultar bitácora/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Indicadores administrativos' })).not.toBeInTheDocument()
  })

  it('shows affiliate actions from linked affiliation regardless of affiliate status', () => {
    auth.user = { fullName: 'María Solano', role: 'Vecino/Afiliado', affiliateId: '18', affiliateStatus: 'INACTIVE', permissionCodes: [] }
    render(<MemoryRouter><AppHomePage /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /Solicitar una reserva/ })).toHaveAttribute('href', '/servicios/reservas')
    expect(screen.getByRole('link', { name: /Enviar justificación/ })).toHaveAttribute('href', '/app/affiliate/absence-justifications/new')
    expect(screen.getByRole('link', { name: /Mis justificaciones/ })).toHaveAttribute('href', '/app/affiliate/justifications')
    expect(screen.getByRole('link', { name: 'Mi perfil' })).toHaveAttribute('href', '/profile')
    expect(screen.getByRole('link', { name: 'Afiliación' })).toHaveAttribute('href', '/afiliacion')
    expect(screen.getByRole('link', { name: 'Eventos' })).toHaveAttribute('href', '/eventos')
    expect(screen.queryByRole('link', { name: /Gestionar usuarios|Revisar solicitudes|Consultar bitácora/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Accesos rápidos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Indicadores administrativos' })).not.toBeInTheDocument()
    expect(inventoryReportsService.summary).not.toHaveBeenCalled()
  })

  it('omits legacy financial actions and cumulative financial metrics for treasurers', () => {
    auth.user = { fullName: 'Carlos Ruiz', role: 'Tesorero', affiliateId: null, affiliateStatus: null, permissionCodes: ['fin.movements.read', 'fin.dinadeco.read'] }
    render(<MemoryRouter><AppHomePage /></MemoryRouter>)
    expect(screen.queryByRole('heading', { name: 'Accesos rápidos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Cargos financieros|Movimientos financieros|Informe DINADECO/ })).not.toBeInTheDocument()
    expect(screen.queryByText('Ingresos')).not.toBeInTheDocument()
    expect(screen.queryByText('Egresos')).not.toBeInTheDocument()
    expect(screen.queryByText('Balance')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Afiliación' })).toHaveAttribute('href', '/afiliacion')
    expect(screen.queryByRole('heading', { name: 'Indicadores administrativos' })).not.toBeInTheDocument()
  })

  it('does not treat UserRequest administration permission as community affiliation', () => {
    auth.user = { fullName: 'Laura Vega', role: 'Revisora', affiliateId: null, affiliateStatus: null, permissionCodes: ['usr.user-requests.read'] }
    render(<MemoryRouter><AppHomePage /></MemoryRouter>)

    expect(screen.getByRole('link', { name: /Solicitar una reserva/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Enviar justificación/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Mis justificaciones/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mi perfil' })).toBeInTheDocument()
  })
})
