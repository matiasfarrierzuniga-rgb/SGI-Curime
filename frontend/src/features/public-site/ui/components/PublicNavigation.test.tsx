import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PublicFooter } from './PublicFooter'
import { PublicHeader } from './PublicHeader'

const auth = vi.hoisted(() => ({
  isAuthenticated: false,
  user: null as null | { canAccessErp: boolean },
  logout: vi.fn(),
}))

vi.mock('@/features/auth', () => ({ useAuth: () => auth }))

function renderHeader() {
  return render(<MemoryRouter><PublicHeader /></MemoryRouter>)
}

function renderFooter() {
  return render(<MemoryRouter><PublicFooter /></MemoryRouter>)
}

beforeEach(() => {
  auth.isAuthenticated = false
  auth.user = null
  auth.logout.mockReset()
})

describe('PublicHeader authentication states', () => {
  it('shows public access without authenticated actions to guests', () => {
    renderHeader()

    expect(screen.getAllByRole('button', { name: 'Iniciar sesión' })).not.toHaveLength(0)
    expect(screen.queryByRole('button', { name: 'Ir al panel' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).not.toBeInTheDocument()
  })

  it('shows services and logout, but not the panel, to a general account', () => {
    auth.isAuthenticated = true
    auth.user = { canAccessErp: false }
    renderHeader()

    expect(screen.getAllByRole('button', { name: 'Ver servicios' })).not.toHaveLength(0)
    expect(screen.queryByRole('button', { name: 'Ir al panel' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Cerrar sesión' })).not.toHaveLength(0)
  })

  it('shows panel and logout to an ERP user and keeps logout functional', () => {
    auth.isAuthenticated = true
    auth.user = { canAccessErp: true }
    renderHeader()

    expect(screen.getAllByRole('button', { name: 'Ir al panel' })).not.toHaveLength(0)
    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar sesión' })[0])
    expect(auth.logout).toHaveBeenCalledOnce()
  })
})

describe('PublicFooter authentication states', () => {
  it('shows login and account registration to guests', () => {
    renderFooter()

    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Solicitar una cuenta' })).toHaveAttribute('href', '/register')
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).not.toBeInTheDocument()
  })

  it('shows a high-contrast logout and services to a general account', () => {
    auth.isAuthenticated = true
    auth.user = { canAccessErp: false }
    renderFooter()

    expect(screen.getByRole('link', { name: 'Ver servicios' })).toHaveAttribute('href', '/servicios')
    expect(screen.queryByRole('link', { name: 'Solicitar una cuenta' })).not.toBeInTheDocument()
    const logout = screen.getByRole('button', { name: 'Cerrar sesión' })
    expect(logout).toHaveClass('bg-brand-ivory', 'text-brand-ink')
    fireEvent.click(logout)
    expect(auth.logout).toHaveBeenCalledOnce()
  })

  it('shows panel access to an ERP user', () => {
    auth.isAuthenticated = true
    auth.user = { canAccessErp: true }
    renderFooter()

    expect(screen.getByRole('link', { name: 'Ir al panel' })).toHaveAttribute('href', '/app')
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
  })
})
