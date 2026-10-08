import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErpLayout } from './ErpLayout'

const auth = vi.hoisted(() => ({ user: { fullName: 'Ana Pérez', role: 'Administrador', affiliateId: null as string | null, permissionCodes: ['inv.inventory.read', 'fin.charges.read', 'fin.movements.read', 'fin.dinadeco.read'] }, logout: vi.fn() }))
vi.mock('@/features/auth', () => ({ useAuth: () => auth }))

function renderLayout(initialPath = '/app') {
  return render(<MemoryRouter initialEntries={[initialPath]}><Routes><Route element={<ErpLayout />}><Route path="/app" element={<h1>Área de gestión</h1>} /><Route path="/app/profile" element={<h1>Mi perfil</h1>} /><Route path="/inventory" element={<h1>Inventario</h1>} /><Route path="/inventory/items" element={<h1>Artículos</h1>} /><Route path="/app/financial" element={<h1>Finanzas</h1>} /><Route path="/app/financial/movements" element={<h1>Movimientos financieros</h1>} /><Route path="/app/financial/dinadeco" element={<h1>DINADECO</h1>} /></Route><Route path="/login" element={<h1>Iniciar sesión</h1>} /></Routes></MemoryRouter>)
}

describe('ErpLayout', () => {
  beforeEach(() => { vi.clearAllMocks(); auth.user = { fullName: 'Ana Pérez', role: 'Administrador', affiliateId: null, permissionCodes: ['inv.inventory.read', 'fin.charges.read', 'fin.movements.read', 'fin.dinadeco.read'] } })

  it('renders desktop navigation, session context, and public-site actions', () => {
    renderLayout()
    expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('navigation', { name: 'Navegación del sistema' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Inicio' })[0]).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('navigation', { name: 'Ubicación actual' })).toHaveTextContent('Área de gestiónInicio')
    expect(screen.getAllByRole('link', { name: 'Ver sitio público' })[0]).toHaveAttribute('href', '/')
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.queryByRole('link', { name: 'Enviar justificación' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Mis justificaciones' })).not.toBeInTheDocument()
  })

  it('shows affiliate navigation when the ERP user has a linked affiliate', () => {
    auth.user = { ...auth.user, affiliateId: '18' }
    renderLayout()

    expect(screen.getAllByRole('link', { name: 'Enviar justificación' })[0]).toHaveAttribute('href', '/app/affiliate/absence-justifications/new')
    expect(screen.getAllByRole('link', { name: 'Mis justificaciones' })[0]).toHaveAttribute('href', '/app/affiliate/justifications')
  })

  it('opens accessible mobile navigation and closes it after navigation', () => {
    renderLayout()
    const trigger = screen.getByRole('button', { name: 'Abrir navegación' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog', { name: 'Navegación móvil' })).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('link', { name: 'Ver sitio público' }).at(-1)!)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('provides a collapsible navigation control for tablet layouts', () => {
    renderLayout()
    const trigger = screen.getByRole('button', { name: 'Expandir navegación' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(trigger)
    expect(screen.getByRole('button', { name: 'Contraer navegación' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('expands a collapsed sidebar and opens a generic navigation group before navigating', () => {
    renderLayout()
    const inventory = screen.getByRole('link', { name: 'Inventario' })

    expect(inventory).toHaveAttribute('title', 'Inventario')
    fireEvent.click(inventory)

    expect(screen.getByRole('button', { name: 'Contraer navegación' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Resumen' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Artículos' })).toBeInTheDocument()
  })

  it('applies collapsed group behavior to finance without role-based access', () => {
    renderLayout()
    fireEvent.click(screen.getByRole('link', { name: 'Finanzas' }))

    expect(screen.getByRole('button', { name: 'Contraer navegación' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Resumen' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Movimientos financieros' })).toBeInTheDocument()
  })

  it.each([
    ['fin.movements.read', 'Movimientos financieros'],
    ['fin.dinadeco.read', 'DINADECO'],
  ])('routes a collapsed finance group to its authorized %s child', (permissionCode, childLabel) => {
    auth.user = { fullName: 'Ana Pérez', role: 'Administrador', affiliateId: null, permissionCodes: [permissionCode] }
    renderLayout()
    fireEvent.click(screen.getByRole('link', { name: 'Finanzas' }))

    expect(screen.getByRole('button', { name: 'Contraer navegación' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: childLabel })).toHaveAttribute('aria-current', 'page')
  })

  it('does not expand the collapsed sidebar for a simple item', () => {
    renderLayout()
    fireEvent.click(screen.getByRole('link', { name: 'Inicio' }))

    expect(screen.getByRole('button', { name: 'Expandir navegación' })).toBeInTheDocument()
  })

  it('opens profile inside ERP layout and marks the account item current', () => {
    renderLayout('/app/profile')
    expect(screen.getAllByRole('link', { name: 'Mi perfil' })[0]).toHaveAttribute('href', '/app/profile')
    expect(screen.getAllByRole('link', { name: 'Mi perfil' })[0]).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('navigation', { name: 'Ubicación actual' })).toHaveTextContent('Área de gestiónMi perfil')
    expect(screen.queryByRole('link', { name: 'Iniciar sesión' })).not.toBeInTheDocument()
  })

  it('keeps an opened group expanded while navigating between its children', () => {
    renderLayout('/inventory')
    fireEvent.click(screen.getByRole('button', { name: 'Expandir navegación' }))
    fireEvent.click(screen.getByRole('link', { name: 'Artículos' }))

    expect(screen.getByRole('button', { name: 'Contraer navegación' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Artículos' })).toHaveAttribute('aria-current', 'page')
  })

  it('keeps logout working', () => {
    renderLayout()
    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar sesión' })[0])
    expect(auth.logout).toHaveBeenCalledOnce()
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })
})
