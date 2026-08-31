import { fireEvent, render, screen, within } from '@testing-library/react'
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
    expect(container.querySelector('h1')).toHaveTextContent(/información, participación y servicios/i)
    expect(document.title).toBe('Portal comunitario | ADI Curime')
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
    expect(menuButton).toHaveFocus()
  })

  it('muestra marca, enlace activo y cierra menú al navegar', () => {
    renderPublic('/servicios')
    expect(screen.getByRole('link', { name: 'ADI Curime, inicio' })).toBeInTheDocument()
    const navigation = screen.getByRole('navigation', { name: /navegación pública/i })
    expect(navigation.querySelector('a[href="/servicios"]')).toHaveAttribute('aria-current', 'page')

    const menuButton = screen.getByRole('button', { name: /abrir menú/i })
    fireEvent.click(menuButton)
    fireEvent.click(navigation.querySelector('a[href="/servicios"]')!)
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('incluye un enlace para saltar al contenido principal', () => {
    renderPublic()
    expect(screen.getByRole('link', { name: /saltar al contenido/i })).toHaveAttribute('href', '#public-content')
  })

  it('muestra transparencia con enlace a información autorizada', () => {
    renderPublic()
    expect(screen.getByRole('heading', { name: /información pública, con claridad/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ir a transparencia/i })).toHaveAttribute('href', '/transparencia')
  })

  it('muestra rutas comunitarias reales y futuras opciones no interactivas', () => {
    renderPublic()
    expect(screen.getByRole('heading', { name: /encuentre lo que necesita/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /consultar sobre afiliación/i })).toHaveAttribute('href', '/afiliacion')
    expect(screen.getAllByText('Próximamente')).toHaveLength(3)
    expect(screen.queryByRole('link', { name: /reservas/i })).not.toBeInTheDocument()
  })

  it('separa acceso público y acceso al SGI', () => {
    renderPublic()
    const accessLinks = screen.getAllByRole('link', { name: 'Ingresar al SGI' })
    expect(accessLinks).not.toHaveLength(0)
    accessLinks.forEach((link) => expect(link).toHaveAttribute('href', '/login'))
  })

  it('ofrece Ingresar al SGI a visitantes', () => {
    renderPublic()
    const links = screen.getAllByRole('link', { name: 'Ingresar al SGI' })
    expect(links.length).toBeGreaterThan(0)
    links.forEach((link) => expect(link).toHaveAttribute('href', '/login'))
  })

  it('muestra los canales oficiales con enlaces accesibles y seguros', () => {
    renderPublic('/contacto')
    const contact = within(screen.getByRole('main'))

    expect(contact.getByRole('heading', { name: 'Instagram' })).toBeVisible()
    expect(contact.getByText('@adicurime')).toBeVisible()
    expect(contact.getByRole('heading', { name: 'Facebook' })).toBeVisible()
    expect(contact.getByRole('heading', { name: 'Correo electrónico' })).toBeVisible()
    expect(contact.getByText('adicurimenicoya@gmail.com')).toBeVisible()

    const instagram = contact.getByRole('link', { name: 'Abrir Instagram de ADI Curime' })
    expect(instagram).toHaveAttribute('href', 'https://www.instagram.com/adicurime?igsi=NnM0cGRvaGZ3cmZt')
    expect(instagram).toHaveAttribute('target', '_blank')
    expect(instagram).toHaveAttribute('rel', 'noopener noreferrer')

    const facebook = contact.getByRole('link', { name: 'Abrir Facebook de ADI Curime' })
    expect(facebook).toHaveAttribute('href', 'https://www.facebook.com/profile.php?id=100084633551482')
    expect(facebook).toHaveAttribute('target', '_blank')
    expect(facebook).toHaveAttribute('rel', 'noopener noreferrer')

    const email = contact.getByRole('link', { name: 'Enviar correo a ADI Curime' })
    expect(email).toHaveAttribute('href', 'mailto:adicurimenicoya@gmail.com')
    expect(email).not.toHaveAttribute('target')
  })

  it('muestra el formulario de consulta y errores inline básicos', () => {
    renderPublic('/contacto')
    const contact = within(screen.getByRole('main'))
    const firstName = contact.getByLabelText(/^Nombre/)
    const lastNames = contact.getByLabelText(/^Apellidos/)
    const email = contact.getByLabelText(/^Correo electrónico/)
    const subject = contact.getByLabelText(/^Asunto/)
    const message = contact.getByLabelText(/^Mensaje/)

    expect(firstName).toHaveAttribute('autocomplete', 'given-name')
    expect(lastNames).toHaveAttribute('autocomplete', 'family-name')
    expect(email).toHaveAttribute('autocomplete', 'email')
    expect(contact.getByRole('button', { name: 'Enviar consulta' })).toBeVisible()

    fireEvent.click(contact.getByRole('button', { name: 'Enviar consulta' }))

    expect(firstName).toHaveAttribute('aria-invalid', 'true')
    expect(lastNames).toHaveAttribute('aria-invalid', 'true')
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(subject).toHaveAttribute('aria-invalid', 'true')
    expect(message).toHaveAttribute('aria-invalid', 'true')
    expect(contact.getAllByRole('alert')).toHaveLength(5)
    expect(contact.queryByText(/enviado correctamente/i)).not.toBeInTheDocument()
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
