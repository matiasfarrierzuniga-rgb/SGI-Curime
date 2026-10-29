import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PublicLayout } from '@/app/layouts/PublicLayout'
import { LandingPage } from '@/features/public-site'
import { PublicEventsPage } from '@/features/events'
import { publicContentService } from '../../services/publicContentService'
import { AboutPage, CommunityPage, ContactPage, NewsDetailPage, NewsPage, ServicesPage, TransparencyPage } from './PublicPages'

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  user: null as null | { canAccessErp: boolean },
  logout: vi.fn(),
}))
vi.mock('@/features/auth', () => ({
  useAuth: () => authState,
}))
vi.mock('@/shared/api/httpClient', () => ({ httpClient: { get: vi.fn().mockResolvedValue({ data: [] }) } }))

function renderPublic(path = '/') {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter initialEntries={[path]}>
      <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/servicios" element={<ServicesPage />} />
            <Route path="/nosotros" element={<AboutPage />} />
            <Route path="/comunidad" element={<CommunityPage />} />
            <Route path="/contacto" element={<ContactPage />} />
            <Route path="/noticias" element={<NewsPage />} />
            <Route path="/noticias/:slug" element={<NewsDetailPage />} />
            <Route path="/transparencia" element={<TransparencyPage />} />
            <Route path="/eventos" element={<PublicEventsPage />} />
          </Route>
          <Route path="/login" element={<p>Login</p>} />
      </Routes>
    </MemoryRouter></QueryClientProvider>,
  )
}

describe('portal público', () => {
  beforeEach(() => {
    authState.isAuthenticated = false
    authState.user = null
    authState.logout.mockReset()
    vi.stubGlobal('scrollTo', vi.fn())
  })

  afterEach(() => vi.restoreAllMocks())

  it('muestra las siete áreas de Transparencia sin descargas ficticias', () => {
    renderPublic('/transparencia')
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('heading', { name: 'Transparencia', level: 1 })).toBeVisible()
    expect(main.getByRole('img', { name: 'Paisaje rural de Curime, Guanacaste.' })).toHaveAttribute('src', '/images/public/home/hero-curime-fallback.jpg')
    for (const title of ['Documentos públicos', 'Informes', 'Proyectos', 'Rendición de cuentas', 'Reportes administrativos', 'Reportes financieros autorizados', 'Información relacionada con DINADECO']) {
      expect(main.getByRole('heading', { name: title })).toBeVisible()
    }
    expect(main.getAllByText('Información en preparación')).toHaveLength(7)
    expect(main.getAllByRole('article')).toHaveLength(7)
    expect(main.getAllByRole('link')).toHaveLength(1) // Solo la ruta de Inicio del breadcrumb.
  })

  it('mantiene fuera del listado las noticias pendientes y muestra el estado vacío', () => {
    renderPublic('/noticias')
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('heading', { name: 'Noticias', level: 1 })).toBeVisible()
    expect(main.getByRole('heading', { name: 'No hay noticias verificadas publicadas' })).toBeVisible()
    expect(main.queryByRole('link', { name: /Canal informativo de ADI Curime/ })).not.toBeInTheDocument()
  })

  it('no presenta una noticia pendiente como comunicado oficial en su ruta directa', () => {
    renderPublic('/noticias/canal-informativo-en-preparacion')
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('heading', { name: 'Esta noticia está en preparación' })).toBeVisible()
    expect(main.queryByRole('heading', { name: 'Canal informativo de ADI Curime' })).not.toBeInTheDocument()
    expect(document.title).toContain('Noticia en preparación')
    expect(main.getByRole('link', { name: 'Volver a noticias' })).toHaveAttribute('href', '/noticias')
  })

  it('muestra tarjetas y detalles solo cuando existe contenido verificado', () => {
    const verified = { slug: 'comunicado-de-prueba', category: 'Comunidad', date: '20/10/2026', title: 'Comunicado de prueba', excerpt: 'Resumen de prueba.', body: 'Contenido de prueba.' }
    vi.spyOn(publicContentService, 'listNews').mockReturnValue([verified] as unknown as ReturnType<typeof publicContentService.listNews>)
    const { unmount } = renderPublic('/noticias')
    const card = screen.getByRole('heading', { name: 'Comunicado de prueba' }).closest('article')!
    expect(within(card).getByText('Comunidad · 20/10/2026')).toBeVisible()
    expect(within(card).getByRole('link', { name: 'Comunicado de prueba' })).toHaveAttribute('href', '/noticias/comunicado-de-prueba')
    unmount()

    vi.spyOn(publicContentService, 'getNews').mockReturnValue(verified as unknown as ReturnType<typeof publicContentService.getNews>)
    renderPublic('/noticias/comunicado-de-prueba')
    expect(screen.getByRole('heading', { name: 'Comunicado de prueba', level: 1 })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Volver a noticias' })).toHaveAttribute('href', '/noticias')
  })

  it('presenta Nosotros sin publicar historia ni Junta Directiva sin validar', () => {
    renderPublic('/nosotros')
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('heading', { name: 'Conozca nuestra Asociación' })).toBeVisible()
    expect(main.getByRole('img', { name: 'Paisaje rural de Curime, Guanacaste.' })).toHaveAttribute('src', '/images/public/home/hero-curime-fallback.jpg')
    expect(main.getByRole('heading', { name: 'Quiénes somos' })).toBeVisible()
    expect(main.getByRole('heading', { name: 'Misión' })).toBeVisible()
    expect(main.getByRole('heading', { name: 'Visión' })).toBeVisible()
    expect(main.getByRole('heading', { name: 'Objetivos' })).toBeVisible()
    expect(main.getByRole('heading', { name: 'Nuestra historia' })).toBeVisible()
    expect(main.getAllByRole('listitem')).toHaveLength(4)
    expect(main.getByRole('heading', { name: 'Junta Directiva' })).toBeVisible()
    expect(main.getByText(/Integrantes, cargos y período pendientes de validación/)).toBeVisible()
    expect(main.queryByText('2001')).not.toBeInTheDocument()
  })

  it('presenta Comunidad con accesos a los módulos existentes', () => {
    renderPublic('/comunidad')
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('heading', { name: 'Un espacio para encontrarnos' })).toBeVisible()
    expect(main.getByRole('img', { name: 'Actividad comunitaria en la cancha de la comunidad.' })).toHaveAttribute('src', '/images/public/home/community-curime-fallback.jpg')
    expect(main.getByRole('link', { name: 'Contáctenos' })).toHaveAttribute('href', '/contacto')
    expect(main.getByRole('link', { name: 'Ver oportunidades de voluntariado' })).toHaveAttribute('href', '/voluntariado')
    expect(main.getByRole('link', { name: 'Ver emprendimientos' })).toHaveAttribute('href', '/ventures')
    expect(main.getByRole('link', { name: 'Ver eventos' })).toHaveAttribute('href', '/eventos')
    expect(main.getByRole('heading', { name: 'Iniciativas y proyectos' })).toBeVisible()
  })

  it('muestra servicios disponibles y orienta a visitantes antes de reservar', () => {
    renderPublic('/servicios')

    expect(screen.getByRole('heading', { name: 'Servicios para la comunidad' })).toBeVisible()
    expect(screen.getByRole('img', { name: 'Paisaje rural de Curime, Guanacaste.' })).toHaveAttribute('src', '/images/public/home/hero-curime-fallback.jpg')
    expect(screen.getByRole('heading', { name: 'Gestiones que puede iniciar en línea' })).toBeVisible()

    const affiliation = screen.getByRole('heading', { name: 'Afiliación' }).closest('article')!
    expect(within(affiliation).getByText('Disponible')).toBeVisible()
    expect(within(affiliation).getByRole('link', { name: 'Solicitar afiliación' })).toHaveAttribute('href', '/afiliacion')
    expect(within(affiliation).getAllByRole('listitem')).toHaveLength(3)

    const reservations = screen.getByRole('heading', { name: 'Reservas' }).closest('article')!
    expect(within(reservations).getByText('Disponible')).toBeVisible()
    expect(within(reservations).getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login')
    expect(within(reservations).getByRole('link', { name: 'Crear una cuenta' })).toHaveAttribute('href', '/register')

    const entrepreneurship = screen.getByRole('heading', { name: 'Emprendimientos' }).closest('article')!
    expect(within(entrepreneurship).getByText('Disponible')).toBeVisible()
    expect(within(entrepreneurship).getByRole('link', { name: 'Ver emprendimientos' })).toHaveAttribute('href', '/ventures')

    const volunteering = screen.getByRole('heading', { name: 'Voluntariado' }).closest('article')!
    expect(within(volunteering).getByText('Disponible')).toBeVisible()
    expect(within(volunteering).getByText(/postúlese a las actividades/)).toBeVisible()
    expect(within(volunteering).getByRole('link', { name: 'Ver oportunidades' })).toHaveAttribute('href', '/voluntariado')

    const donations = screen.getByRole('heading', { name: 'Donaciones' }).closest('article')!
    expect(within(donations).getByText('Próximamente')).toBeVisible()
    expect(within(donations).getByText(/todavía no recibe donaciones/)).toBeVisible()
    expect(within(donations).queryByRole('link')).not.toBeInTheDocument()

    const registration = screen.getByRole('heading', { name: 'Crear una cuenta' }).closest('section')!
    expect(within(registration).getByText(/verifique su correo/)).toBeVisible()
    expect(within(registration).getAllByRole('link')).toHaveLength(2)
    expect(within(registration).getByRole('link', { name: 'Crear una cuenta' })).toHaveAttribute('href', '/register')
    expect(within(registration).getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login')
    expect(within(screen.getByRole('main')).getAllByRole('article')).toHaveLength(5)
    expect(screen.getByRole('heading', { name: 'Más formas de participar' })).toBeVisible()
  })

  it('permite reservar y oculta la creación de cuenta cuando hay sesión', () => {
    authState.isAuthenticated = true
    renderPublic('/servicios')

    const affiliation = screen.getByRole('heading', { name: 'Afiliación' }).closest('article')!
    expect(within(affiliation).getByRole('link', { name: 'Solicitar afiliación' })).toHaveAttribute('href', '/afiliacion')
    const reservations = screen.getByRole('heading', { name: 'Reservas' }).closest('article')!
    expect(within(reservations).getAllByRole('link')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Solicitar una reserva' })).toHaveAttribute('href', '/servicios/reservas')
    const entrepreneurship = screen.getByRole('heading', { name: 'Emprendimientos' }).closest('article')!
    expect(within(entrepreneurship).getByRole('link', { name: 'Ver emprendimientos' })).toHaveAttribute('href', '/ventures')
    const volunteering = screen.getByRole('heading', { name: 'Voluntariado' }).closest('article')!
    expect(within(volunteering).getByText('Disponible')).toBeVisible()
    expect(within(volunteering).getByRole('link', { name: 'Participar como voluntario' })).toHaveAttribute('href', '/voluntariado')
    expect(screen.queryByRole('heading', { name: 'Crear una cuenta' })).not.toBeInTheDocument()
    expect(screen.queryByText(/verifique su correo para acceder/)).not.toBeInTheDocument()
    expect(within(screen.getByRole('main')).getAllByRole('article')).toHaveLength(5)
    expect(within(screen.getByRole('heading', { name: 'Donaciones' }).closest('article')!).getByText('Próximamente')).toBeVisible()
  })

  it('muestra la landing y navega al inicio de sesión', () => {
    const { container } = renderPublic()
    expect(container.querySelector('h1')).toHaveTextContent(/curime, más cerca de su comunidad/i)
    expect(document.title).toBe('Portal comunitario | ADI Curime')
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toMatch(/portal comunitario/i)

    const loginLink = container.querySelector<HTMLAnchorElement>('a[href="/login"]')
    expect(loginLink).not.toBeNull()
    fireEvent.click(loginLink!)

    expect(screen.getByText('Login')).toBeInTheDocument()
  })

  it('dirige a personas autenticadas al área interna', () => {
    authState.isAuthenticated = true
    authState.user = { canAccessErp: true }
    const { container } = renderPublic()

    expect(container.querySelector<HTMLAnchorElement>('a[href="/app"]')).not.toBeNull()
    expect(screen.getAllByRole('link', { name: 'Ir al panel' })).not.toHaveLength(0)
    authState.isAuthenticated = false
  })

  it('dirige una cuenta general autenticada a servicios', () => {
    authState.isAuthenticated = true
    authState.user = { canAccessErp: false }
    const { container } = renderPublic()

    expect(container.querySelector<HTMLAnchorElement>('a[href="/servicios"]')).not.toBeNull()
    expect(screen.getAllByText('Ver servicios')).not.toHaveLength(0)
    expect(screen.queryByRole('link', { name: 'Ir al panel' })).not.toBeInTheDocument()
  })

  it('abre y cierra el menú móvil con Escape', () => {
    renderPublic()
    const menuButton = screen.getByRole('button', { name: /abrir menú/i })
    fireEvent.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('navigation', { name: /navegación pública/i })).toBeVisible()
    fireEvent.keyDown(document, { key: 'Escape' })
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
    const skipLink = screen.getByRole('link', { name: /saltar al contenido/i })

    expect(skipLink).toHaveAttribute('href', '#public-content')
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1')
    fireEvent.click(skipLink)
    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('muestra transparencia con enlace a información autorizada', () => {
    renderPublic()
    expect(screen.getByRole('heading', { name: /información pública para la comunidad/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ir a transparencia/i })).toHaveAttribute('href', '/transparencia')
  })

  it('conserva jerarquía institucional de Home Pública', () => {
    const { container } = renderPublic()
    const headings = Array.from(container.querySelectorAll('main h1, main h2')).map((heading) => heading.textContent)

    expect(container.querySelectorAll('main h1')).toHaveLength(1)
    expect(headings).toEqual([
      'Curime, más cerca de su comunidad',
      'Encuentre lo que necesita',
      'Próximas actividades',
      'Lo más reciente',
      'Un pueblo unido, un futuro compartido',
      'Un espacio para encontrarnos',
      'Información pública para la comunidad',
    ])
  })

  it('muestra accesos comunitarios y noticias con rutas existentes', () => {
    renderPublic()
    expect(screen.getByRole('heading', { name: /encuentre lo que necesita/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /consultar sobre afiliación/i })).toHaveAttribute('href', '/afiliacion')
    expect(screen.getByRole('link', { name: /agenda y eventos/i })).toHaveAttribute('href', '/eventos')
    const communityAccess = within(screen.getByRole('navigation', { name: 'Accesos comunitarios' }))
    expect(communityAccess.getByRole('link', { name: /emprendimientos/i })).toHaveAttribute('href', '/ventures')
    expect(screen.getByRole('link', { name: /ver todo/i })).toHaveAttribute('href', '/noticias')
    expect(screen.getByRole('heading', { name: /lo más reciente/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /consultar sobre reservas/i })).toHaveAttribute('href', '/servicios/reservas')
  })

  it('separa acceso público e inicio de sesión', () => {
    renderPublic()
    const accessLinks = screen.getAllByRole('link', { name: 'Iniciar sesión' })
    expect(accessLinks).not.toHaveLength(0)
    accessLinks.forEach((link) => expect(link).toHaveAttribute('href', '/login'))
  })

  it('ofrece iniciar sesión a visitantes', () => {
    renderPublic()
    const links = screen.getAllByRole('link', { name: 'Iniciar sesión' })
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
    expect(contact.getByRole('button', { name: 'Revisar consulta' })).toBeVisible()

    fireEvent.click(contact.getByRole('button', { name: 'Revisar consulta' }))

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
