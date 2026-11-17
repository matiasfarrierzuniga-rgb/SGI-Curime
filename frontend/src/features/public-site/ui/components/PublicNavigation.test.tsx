import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PublicFooter } from './PublicFooter'
import { PublicHeader } from './PublicHeader'
import { site } from '@/content/publicSiteContent'

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
  return render(<MemoryRouter><PublicFooter /><Location /></MemoryRouter>)
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
    expect(toggle).toHaveAttribute('type', 'button')
    toggle.focus()
    fireEvent.click(toggle)

    expect(screen.getByRole('navigation', { name: 'Navegación pública' })).toContainElement(screen.getByRole('list'))
    expect(within(screen.getByRole('navigation', { name: 'Navegación pública' })).getAllByRole('listitem')).toHaveLength(6)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.getByRole('button', { name: 'Abrir menú de navegación' })).toHaveFocus()
  })

  it('keeps public community destinations in primary navigation', () => {
    renderHeader()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú de navegación' }))
    fireEvent.click(screen.getByRole('button', { name: 'Comunidad' }))

    expect(screen.getByRole('link', { name: 'Emprendimientos' })).toHaveAttribute('href', '/ventures')
    expect(screen.getByRole('link', { name: 'Voluntariado' })).toHaveAttribute('href', '/voluntariado')
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
  it('renders six main entries with direct Services and Transparency links', () => {
    renderHeader()
    const nav = screen.getByRole('navigation', { name: 'Navegación pública' })
    expect(within(nav).getAllByRole('listitem')).toHaveLength(6)
    expect(within(nav).getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/')
    expect(within(nav).getByRole('link', { name: 'Nosotros' })).toHaveAttribute('href', '/nosotros')
    expect(within(nav).getByRole('link', { name: 'Servicios' })).toHaveAttribute('href', '/servicios')
    expect(within(nav).getByRole('link', { name: 'Transparencia' })).toHaveAttribute('href', '/transparencia')
    expect(within(nav).getByRole('link', { name: 'Contacto' })).toHaveAttribute('href', '/contacto')
    expect(within(nav).getByRole('button', { name: 'Comunidad' })).toHaveAttribute('aria-expanded', 'false')
    expect(within(nav).queryByRole('button', { name: 'Servicios' })).not.toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Servicios' }).querySelector('svg')).toBeNull()
    expect(Array.from(nav.querySelectorAll(':scope > ul > li')).map((item) => item.firstElementChild?.textContent?.trim())).toEqual([
      'Inicio', 'Nosotros', 'Comunidad', 'Servicios', 'Transparencia', 'Contacto',
    ])
    for (const route of ['/', '/nosotros', '/comunidad', '/ventures', '/voluntariado', '/noticias', '/eventos', '/servicios', '/transparencia', '/contacto']) {
      expect(nav.querySelectorAll(`a[href="${route}"]`)).toHaveLength(1)
    }
  })

  it('opens and closes Comunidad with all its destinations', () => {
    renderHeader()
    const button = screen.getByRole('button', { name: 'Comunidad' })
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(button).toHaveAttribute('aria-controls')
    for (const destination of ['Comunidad', 'Emprendimientos', 'Voluntariado', 'Noticias', 'Eventos']) {
      expect(screen.getByRole('link', { name: destination })).toBeInTheDocument()
    }
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it.each([
    ['Inicio', '/'], ['Nosotros', '/nosotros'], ['Comunidad', '/comunidad'],
    ['Emprendimientos', '/ventures'], ['Voluntariado', '/voluntariado'], ['Noticias', '/noticias'], ['Eventos', '/eventos'],
    ['Servicios', '/servicios'], ['Transparencia', '/transparencia'], ['Contacto', '/contacto'],
  ])('navigates to %s at %s and closes the menu', (label, route) => {
    renderHeader()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú de navegación' }))
    if (['Comunidad', 'Emprendimientos', 'Voluntariado', 'Noticias', 'Eventos'].includes(label)) fireEvent.click(screen.getByRole('button', { name: 'Comunidad' }))
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
    const button = screen.getByRole('button', { name: 'Comunidad' })
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
    expect(screen.getByRole('link', { name: 'Voluntariado' })).toBeInTheDocument()
  })

  it('marks nested routes and group triggers active', () => {
    renderHeader('/noticias/nota-ejemplo')
    const group = screen.getByRole('button', { name: 'Comunidad' })
    expect(group).toHaveAttribute('data-active', 'true')
    fireEvent.click(group)
    expect(screen.getByRole('link', { name: 'Noticias' })).toHaveAttribute('aria-current', 'page')
  })

  it.each([
    ['/servicios', 'Servicios'],
    ['/servicios/reservas', 'Servicios'],
    ['/transparencia', 'Transparencia'],
  ])('marks %s active in the primary navigation', (path, label) => {
    renderHeader(path)
    expect(within(screen.getByRole('navigation', { name: 'Navegación pública' })).getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page')
  })

  it('keeps direct links and the Comunidad group inside the mobile menu', () => {
    renderHeader()
    const toggle = screen.getByRole('button', { name: 'Abrir menú de navegación' })
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Comunidad' }))
    expect(screen.getByRole('link', { name: 'Eventos' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Servicios' })).toHaveAttribute('href', '/servicios')
    expect(screen.getByRole('link', { name: 'Transparencia' })).toHaveAttribute('href', '/transparencia')
    expect(screen.queryByRole('button', { name: 'Servicios' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: 'Transparencia' }))
    expect(screen.getByRole('button', { name: 'Abrir menú de navegación' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByTestId('location')).toHaveTextContent('/transparencia')
  })
})

describe('PublicFooter public links', () => {
  it('uses each central public destination once and preserves contact links', () => {
    renderFooter()

    expect(site.nav.find((item) => item.label === 'Voluntariado')).toEqual({ label: 'Voluntariado', to: '/voluntariado' })
    const footer = screen.getByRole('contentinfo')
    for (const item of site.nav.filter((entry) => entry.to !== '/')) {
      expect(footer.querySelectorAll(`a[href="${item.to}"]`)).toHaveLength(1)
    }
    expect(within(footer).getByRole('link', { name: 'Enviar correo a ADI Curime' })).toHaveAttribute('href', `mailto:${site.email}`)
    expect(within(footer).getByRole('link', { name: 'Abrir Instagram de ADI Curime' })).toHaveAttribute('href', site.socialLinks.instagram.url)
    expect(within(footer).getByRole('link', { name: 'Abrir Facebook de ADI Curime' })).toHaveAttribute('href', site.socialLinks.facebook.url)
    expect(within(footer).getAllByRole('link')).toHaveLength(site.nav.length + 2)
    fireEvent.click(within(footer).getByRole('link', { name: 'Voluntariado' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/voluntariado')
  })

  it('omits Sistema and authentication actions for guests and authenticated visitors', () => {
    const { unmount } = renderFooter()
    const guestFooter = within(screen.getByRole('contentinfo'))
    expect(guestFooter.queryByRole('navigation', { name: 'Acceso al sistema' })).not.toBeInTheDocument()
    expect(guestFooter.queryByRole('heading', { name: 'Sistema' })).not.toBeInTheDocument()
    expect(guestFooter.queryByRole('link', { name: 'Iniciar sesión' })).not.toBeInTheDocument()
    expect(guestFooter.queryByRole('link', { name: 'Solicitar una cuenta' })).not.toBeInTheDocument()
    unmount()

    auth.isAuthenticated = true
    auth.user = { canAccessErp: false }
    renderFooter()
    const authenticatedFooter = within(screen.getByRole('contentinfo'))
    expect(authenticatedFooter.getByRole('link', { name: 'Servicios' })).toHaveAttribute('href', '/servicios')
    expect(authenticatedFooter.queryByRole('link', { name: 'Ver servicios' })).not.toBeInTheDocument()
    expect(authenticatedFooter.queryByRole('link', { name: 'Ir al panel' })).not.toBeInTheDocument()
    expect(authenticatedFooter.queryByRole('button', { name: 'Cerrar sesión' })).not.toBeInTheDocument()
  })

  it('keeps the existing login action in the navbar', () => {
    render(<MemoryRouter><PublicHeader /><PublicFooter /></MemoryRouter>)
    const header = within(screen.getByRole('banner'))
    const footer = within(screen.getByRole('contentinfo'))
    expect(header.getAllByRole('button', { name: 'Iniciar sesión' }).some((button) => button.getAttribute('href') === '/login')).toBe(true)
    expect(footer.queryByRole('link', { name: 'Iniciar sesión' })).not.toBeInTheDocument()
  })
})
