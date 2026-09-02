import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErpLayout } from './ErpLayout'

const auth = vi.hoisted(() => ({ user: { fullName: 'Ana Pérez', role: 'Administrador' }, logout: vi.fn() }))
vi.mock('@/features/auth', () => ({ useAuth: () => auth }))

function renderLayout() {
  return render(<MemoryRouter initialEntries={['/app']}><Routes><Route element={<ErpLayout />}><Route path="/app" element={<h1>Área de gestión</h1>} /></Route><Route path="/login" element={<h1>Iniciar sesión</h1>} /></Routes></MemoryRouter>)
}

describe('ErpLayout', () => {
  beforeEach(() => { vi.clearAllMocks(); auth.user = { fullName: 'Ana Pérez', role: 'Administrador' } })

  it('renders desktop navigation, session context, and public-site actions', () => {
    renderLayout()
    expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('navigation', { name: 'Navegación del sistema' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Dashboard' })[0]).toHaveAttribute('aria-current', 'page')
    expect(screen.getAllByRole('link', { name: 'Ver sitio público' })[0]).toHaveAttribute('href', '/')
    expect(screen.getAllByRole('link', { name: 'Mi cuenta' })[0]).toHaveAttribute('href', '/mi-cuenta')
    expect(screen.getAllByRole('main')).toHaveLength(1)
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

  it('keeps logout working', () => {
    renderLayout()
    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar sesión' })[0])
    expect(auth.logout).toHaveBeenCalledOnce()
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })
})
