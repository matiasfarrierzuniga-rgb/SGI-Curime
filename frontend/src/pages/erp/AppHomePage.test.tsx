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
    expect(screen.getByRole('link', { name: /Revisar solicitudes/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Consultar bitácora/ })).toHaveAttribute('href', '/admin/audit-logs')
  })

  it('does not expose administrative actions to inventory managers', async () => {
    auth.user = { fullName: 'Luis Mora', role: 'Gestor de Inventario' }
    render(<MemoryRouter><AppHomePage /></MemoryRouter>)
    expect(await screen.findByText('Artículos activos')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Abrir inventario/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Gestionar usuarios|Revisar solicitudes|Consultar bitácora/ })).not.toBeInTheDocument()
  })

  it('shows a clean empty state when a role has no operational quick actions', () => {
    auth.user = { fullName: 'María Solano', role: 'Vecino/Afiliado' }
    render(<MemoryRouter><AppHomePage /></MemoryRouter>)
    expect(screen.getByText('No hay tareas pendientes disponibles.')).toBeInTheDocument()
    expect(inventoryReportsService.summary).not.toHaveBeenCalled()
  })
})
