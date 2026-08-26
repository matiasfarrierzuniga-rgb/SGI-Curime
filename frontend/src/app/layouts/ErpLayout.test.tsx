import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErpLayout } from './ErpLayout'

const logout = vi.fn()

vi.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { fullName: 'Ana Pérez', role: 'Administrador' }, logout }),
}))

describe('ErpLayout', () => {
  beforeEach(() => vi.clearAllMocks())
  it('renders session context, portal link, navigation, and one main landmark', () => {
    render(<MemoryRouter initialEntries={['/app']}><Routes><Route element={<ErpLayout />}><Route path="/app" element={<h1>Área de gestión</h1>} /></Route><Route path="/login" element={<h1>Iniciar sesión</h1>} /></Routes></MemoryRouter>)

    expect(screen.getByText('Ana Pérez')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Portal público' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('navigation', { name: 'Navegación del sistema' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Roles' })).toHaveAttribute('href', '/app/roles')
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })

  it('opens its user menu and closes the authenticated session', () => {
    render(<MemoryRouter initialEntries={['/app']}><Routes><Route element={<ErpLayout />}><Route path="/app" element={<h1>Área de gestión</h1>} /></Route><Route path="/login" element={<h1>Iniciar sesión</h1>} /></Routes></MemoryRouter>)

    fireEvent.click(screen.getByRole('button', { name: 'Menú de usuario de Ana Pérez' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }))

    expect(logout).toHaveBeenCalledOnce()
  })
})
