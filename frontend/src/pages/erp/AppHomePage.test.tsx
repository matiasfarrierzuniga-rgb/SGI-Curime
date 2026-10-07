import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppHomePage } from './AppHomePage'
import { inventoryReportsService } from '@/services/inventoryReportsService'

const auth = vi.hoisted((): { user: { fullName: string; role: string; permissionCodes: string[] } } => ({ user: { fullName: 'Ana Pérez', role: 'Administrador', permissionCodes: [] } }))
vi.mock('@/features/auth', () => ({ useAuth: () => auth }))
vi.mock('@/features/admin-dashboard', () => ({ AdminDashboard: () => <section><h2>Indicadores administrativos</h2><p>Afiliados activos</p></section> }))
vi.mock('@/services/inventoryReportsService', () => ({ inventoryReportsService: { summary: vi.fn() } }))

const summary = { totalItems: 12, activeItems: 10, inactiveItems: 2, totalCategories: 4, lowStockCount: 2, outOfStockCount: 1, activeLoans: 3, overdueLoans: 1 }

describe('AppHomePage', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(inventoryReportsService.summary).mockResolvedValue(summary) })

  it('renders V1 administrative dashboard without broad legacy quick actions', async () => {
    auth.user = { fullName: 'Ana Pérez', role: 'Administrador', permissionCodes: ['usr.users.read'] }
    render(<MemoryRouter><AppHomePage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(await screen.findByText('Afiliados activos')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Indicadores administrativos' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Accesos rápidos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Gestionar usuarios|Revisar solicitudes|Consultar bitácora|Movimientos financieros/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/Módulo en desarrollo/i)).not.toBeInTheDocument()
    expect(inventoryReportsService.summary).not.toHaveBeenCalled()
  })

  it('keeps inventory summary without broad legacy action grid', async () => {
    auth.user = { fullName: 'Luis Mora', role: 'Gestor de Inventario', permissionCodes: ['inv.inventory.read'] }
    render(<MemoryRouter><AppHomePage /></MemoryRouter>)
    expect(await screen.findByText('Artículos activos')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Atención requerida' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Inventario/ })).toHaveAttribute('href', '/inventory')
    expect(screen.getByRole('link', { name: /Artículos agotados/ })).toHaveAttribute('href', '/inventory/alerts')
    expect(screen.queryByRole('heading', { name: 'Indicadores administrativos' })).not.toBeInTheDocument()
  })

  it('shows a clear set of real account actions to community users', () => {
    auth.user = { fullName: 'María Solano', role: 'Vecino/Afiliado', permissionCodes: ['usr.user-requests.read'] }
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

  it('shows only available operational modules and omits cumulative financial metrics for treasurers', () => {
    auth.user = { fullName: 'Carlos Ruiz', role: 'Tesorero', permissionCodes: ['fin.movements.read', 'fin.dinadeco.read'] }
    render(<MemoryRouter><AppHomePage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Módulos disponibles' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Movimientos financieros/ })).toHaveAttribute('href', '/app/financial/movements')
    expect(screen.getByRole('link', { name: /DINADECO/ })).toHaveAttribute('href', '/app/financial/dinadeco')
    expect(screen.queryByText('Ingresos')).not.toBeInTheDocument()
    expect(screen.queryByText('Egresos')).not.toBeInTheDocument()
    expect(screen.queryByText('Balance')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Afiliación' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Indicadores administrativos' })).not.toBeInTheDocument()
  })

  it('does not expose operational shortcuts without their capabilities', () => {
    auth.user = { fullName: 'Laura Díaz', role: 'Usuario', permissionCodes: [] }
    render(<MemoryRouter><AppHomePage /></MemoryRouter>)

    expect(screen.queryByRole('navigation', { name: 'Módulos disponibles' })).not.toBeInTheDocument()
    expect(inventoryReportsService.summary).not.toHaveBeenCalled()
  })

  it('does not render false zeroes while the inventory summary is loading', () => {
    auth.user = { fullName: 'Luis Mora', role: 'Gestor de Inventario', permissionCodes: ['inv.inventory.read'] }
    vi.mocked(inventoryReportsService.summary).mockReturnValue(new Promise<never>(() => {}))
    render(<MemoryRouter><AppHomePage /></MemoryRouter>)

    expect(screen.getByLabelText('Cargando resumen de inventario')).toBeInTheDocument()
    expect(screen.queryByText('Artículos activos')).not.toBeInTheDocument()
    expect(screen.queryByText('Préstamos activos')).not.toBeInTheDocument()
  })

  it('distinguishes a real zero inventory summary from an empty or error state', async () => {
    auth.user = { fullName: 'Luis Mora', role: 'Gestor de Inventario', permissionCodes: ['inv.inventory.read'] }
    vi.mocked(inventoryReportsService.summary).mockResolvedValue({ ...summary, activeItems: 0, activeLoans: 0, lowStockCount: 0, outOfStockCount: 0, overdueLoans: 0 })
    render(<MemoryRouter><AppHomePage /></MemoryRouter>)

    expect(await screen.findByText('Artículos activos')).toBeInTheDocument()
    expect(screen.getByText('Préstamos activos')).toBeInTheDocument()
    expect(screen.getAllByText('0')).toHaveLength(2)
    expect(screen.getByText('No hay alertas de inventario pendientes.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows a compact inventory error without inventing summary values', async () => {
    auth.user = { fullName: 'Luis Mora', role: 'Gestor de Inventario', permissionCodes: ['inv.inventory.read'] }
    vi.mocked(inventoryReportsService.summary).mockRejectedValue(new Error('network'))
    render(<MemoryRouter><AppHomePage /></MemoryRouter>)

    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible cargar el resumen de inventario.')
    expect(screen.queryByText('Artículos activos')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Inventario/ })).toHaveAttribute('href', '/inventory')
  })
})
