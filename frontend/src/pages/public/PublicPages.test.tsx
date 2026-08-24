import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { PublicLayout } from '@/app/layouts/PublicLayout'
import { LandingPage } from '@/features/public-site'
import { ContactPage, EventsPage, NewsPage, ServicesPage } from './PublicPages'

const authState = vi.hoisted(() => ({ isAuthenticated: false }))
vi.mock('@/features/auth', () => ({
  useAuth: () => authState,
}))

function renderPublic(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/servicios" element={<ServicesPage />} />
            <Route path="/contacto" element={<ContactPage />} />
            <Route path="/noticias" element={<NewsPage />} />
            <Route path="/eventos" element={<EventsPage />} />
          </Route>
          <Route path="/login" element={<p>Login</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('portal público', () => {
  it('muestra la landing y navega al inicio de sesión', () => {
    const { container } = renderPublic()
    expect(container.querySelector('h1')).toHaveTextContent(/gestión y desarrollo/i)
    expect(document.title).toBe('SGI-Curime | ADI Curime')
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toMatch(/portal comunitario/i)

    const loginLink = container.querySelector<HTMLAnchorElement>('a[href="/login"]')
    expect(loginLink).not.toBeNull()
    fireEvent.click(loginLink!)

    expect(screen.getByText('Login')).toBeInTheDocument()
  })

  it('dirige a personas autenticadas al área interna', () => {
    authState.isAuthenticated = true
    const { container } = renderPublic()

    expect(container.querySelector<HTMLAnchorElement>('a[href="/app"]')).not.toBeNull()
    expect(screen.getAllByRole('link', { name: 'Ir al SGI' })).not.toHaveLength(0)
    authState.isAuthenticated = false
  })

  it('abre y cierra el menú móvil con Escape', () => {
    renderPublic()
    const menuButton = screen.getByRole('button', { name: /abrir menú/i })
    fireEvent.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('navigation', { name: /navegación pública/i })).toBeVisible()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('incluye un enlace para saltar al contenido principal', () => {
    renderPublic()
    expect(screen.getByRole('link', { name: /saltar al contenido/i })).toHaveAttribute('href', '#public-content')
  })

  it('muestra actualidad comunitaria con enlace a todas las noticias', () => {
    renderPublic()
    expect(screen.getByRole('heading', { name: /avanzamos juntos/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver todas las noticias/i })).toHaveAttribute('href', '/noticias')
    expect(screen.getByRole('link', { name: /leer noticia/i })).toHaveAttribute('href', '/noticias/canal-informativo-en-preparacion')
  })

  it('muestra beneficios y servicios con enlaces reales', () => {
    renderPublic()
    expect(screen.getByRole('heading', { name: /gestión centralizada/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /herramientas para una gestión eficiente/i })).toBeInTheDocument()
    const serviceLinks = screen.getAllByRole('link', { name: /conocer más/i })
    expect(serviceLinks).toHaveLength(4)
    for (const link of serviceLinks) {
      expect(link).toHaveAttribute('href', '/servicios')
    }
  })

  it('ofrece solicitud de cuenta en el hero', () => {
    renderPublic()
    const links = screen.getAllByRole('link', { name: /solicitar una cuenta/i })
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link).toHaveAttribute('href', '/register')
    }
  })


  it.each([
    ['/servicios', /servicios/i],
    ['/contacto', /contacto/i],
    ['/noticias', /noticias/i],
    ['/eventos', /eventos/i],
  ])('muestra %s', (path: string, heading: RegExp) => {
    renderPublic(path)
    expect(screen.getByRole('heading', { name: heading, level: 1 })).toBeInTheDocument()
  })
})
