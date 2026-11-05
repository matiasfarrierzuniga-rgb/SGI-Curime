import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PublicFooter } from './PublicFooter'
import { PublicHeader } from './PublicHeader'

const auth = vi.hoisted(() => ({
  isAuthenticated: false,
  user: null as null | { canAccessErp: boolean },
  logout: vi.fn(),
}))

vi.mock('@/features/auth', () => ({ useAuth: () => auth }))

function Location() {
  const { pathname } = useLocation()
  return <output data-testid="location">{pathname}</output>
}

function renderHeader(path = '/') {
  return render(<MemoryRouter initialEntries={[path]}><PublicHeader /><Location /></MemoryRouter>)
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
  it('uses a semantic navigation list and returns focus after Escape', () => {
    renderHeader()

    const toggle = screen.getByRole('button', { name: 'Abrir menú de navegación' })
    fireEvent.click(toggle)

    expect(screen.getByRole('navigation', { name: 'Navegación pública' })).toContainElement(screen.getByRole('list'))
    expect(within(screen.getByRole('navigation', { name: 'Navegación pública' })).getAllByRole('listitem')).toHaveLength(5)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.getByRole('button', { name: 'Abrir menú de navegación' })).toHaveFocus()
  })

  it('keeps the public ventures directory in primary navigation', () => {
    renderHeader()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú de navegación' }))
    fireEvent.click(screen.getByRole('button', { name: 'Comunidad' }))

    expect(screen.getByRole('link', { name: 'Emprendimientos' })).toHaveAttribute('href', '/ventures')
  })

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

describe('PublicHeader navigation groups', () => {
  it('renders five main entries without duplicate desktop links', () => {
    renderHeader()
    const nav = screen.getByRole('navigation', { name: 'Navegación pública' })
    expect(within(nav).getAllByRole('listitem')).toHaveLength(5)
    expect(within(nav).getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/')
    expect(within(nav).getByRole('link', { name: 'Nosotros' })).toHaveAttribute('href', '/nosotros')
    expect(within(nav).getByRole('link', { name: 'Contacto' })).toHaveAttribute('href', '/contacto')
    expect(within(nav).getByRole('button', { name: 'Comunidad' })).toHaveAttribute('aria-expanded', 'false')
    expect(within(nav).getByRole('button', { name: 'Servicios' })).toHaveAttribute('aria-expanded', 'false')
    for (const route of ['/', '/nosotros', '/comunidad', '/ventures', '/noticias', '/eventos', '/servicios', '/transparencia', '/contacto']) {
      expect(nav.querySelectorAll(`a[href="${route}"]`)).toHaveLength(1)
    }
  })

  it.each([
    ['Comunidad', ['Comunidad', 'Emprendimientos', 'Noticias', 'Eventos']],
    ['Servicios', ['Servicios', 'Transparencia']],
  ] as const)('opens and closes %s with all its destinations', (group, destinations) => {
    renderHeader()
    const button = screen.getByRole('button', { name: group })
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(button).toHaveAttribute('aria-controls')
    for (const destination of destinations) expect(screen.getByRole('link', { name: destination })).toBeInTheDocument()
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it.each([
    ['Inicio', '/'], ['Nosotros', '/nosotros'], ['Comunidad', '/comunidad'],
    ['Emprendimientos', '/ventures'], ['Noticias', '/noticias'], ['Eventos', '/eventos'],
    ['Servicios', '/servicios'], ['Transparencia', '/transparencia'], ['Contacto', '/contacto'],
  ])('navigates to %s at %s and closes the menu', (label, route) => {
    renderHeader()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú de navegación' }))
    if (['Comunidad', 'Emprendimientos', 'Noticias', 'Eventos'].includes(label)) fireEvent.click(screen.getByRole('button', { name: 'Comunidad' }))
    if (['Servicios', 'Transparencia'].includes(label)) fireEvent.click(screen.getByRole('button', { name: 'Servicios' }))
    fireEvent.click(screen.getByRole('link', { name: label }))
    expect(screen.getByTestId('location')).toHaveTextContent(route)
    expect(screen.getByRole('button', { name: 'Abrir menú de navegación' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes a dropdown with Escape and restores focus to its trigger', () => {
    renderHeader()
    const button = screen.getByRole('button', { name: 'Comunidad' })
    fireEvent.click(button)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveFocus()
  })

  it('closes a dropdown after a pointer click outside the header', () => {
    renderHeader()
    const button = screen.getByRole('button', { name: 'Servicios' })
    fireEvent.click(button)
    fireEvent.pointerDown(document.body)
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens with ArrowDown and focuses the first link for keyboard navigation', async () => {
    renderHeader()
    const button = screen.getByRole('button', { name: 'Comunidad' })
    button.focus()
    fireEvent.keyDown(button, { key: 'ArrowDown' })
    expect(button).toHaveAttribute('aria-expanded', 'true')
    const firstLink = screen.getByRole('link', { name: 'Comunidad' })
    await waitFor(() => expect(firstLink).toHaveFocus())
    expect(screen.getByRole('link', { name: 'Emprendimientos' })).toBeInTheDocument()
  })

  it('marks nested routes and group triggers active', () => {
    renderHeader('/noticias/nota-ejemplo')
    const group = screen.getByRole('button', { name: 'Comunidad' })
    expect(group).toHaveAttribute('data-active', 'true')
    fireEvent.click(group)
    expect(screen.getByRole('link', { name: 'Noticias' })).toHaveAttribute('aria-current', 'page')
  })

  it('expands and collapses groups inside the mobile menu', () => {
    renderHeader()
    const toggle = screen.getByRole('button', { name: 'Abrir menú de navegación' })
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Comunidad' }))
    expect(screen.getByRole('link', { name: 'Eventos' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Servicios' }))
    expect(screen.getByRole('link', { name: 'Transparencia' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Comunidad' })).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(screen.getByRole('link', { name: 'Transparencia' }))
    expect(screen.getByRole('button', { name: 'Abrir menú de navegación' })).toHaveAttribute('aria-expanded', 'false')
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
    expect(logout).toHaveClass('!text-text-inverse/80', 'hover:!bg-brand-ivory/10')
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
