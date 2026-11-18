import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PublicLayout } from '@/app/layouts/PublicLayout'
import { LandingPage } from '@/features/public-site'
import { PublicEventsPage } from '@/features/events'
import { publicContentService } from '../../services/publicContentService'
import { Breadcrumbs, PublicPageHeader } from '../../components/public/PublicComponents'
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

  it('usa la escala compartida en encabezados públicos sin impedir el ajuste de títulos largos', () => {
    render(<MemoryRouter><PublicPageHeader breadcrumb="Emprendimientos" title="Emprendimientos comunitarios" intro="Conozca las iniciativas publicadas." /></MemoryRouter>)

    const title = screen.getByRole('heading', { name: 'Emprendimientos comunitarios', level: 1 })
    expect(title).toHaveClass('public-heading', 'text-heading-1')
    expect(title).not.toHaveClass('whitespace-nowrap')
    expect(screen.getByText('Conozca las iniciativas publicadas.')).toHaveClass('text-body-large')
    expect(screen.getByText('ADI Curime · Información institucional')).toHaveClass('public-eyebrow')
  })

  it('distingue el título de página de los encabezados de sección', () => {
    renderPublic('/nosotros')
    expect(screen.getByRole('heading', { name: 'Conozca nuestra Asociación', level: 1 })).toHaveClass('text-heading-1')
    expect(screen.getByRole('heading', { name: 'Quiénes somos', level: 2 })).toHaveClass('public-heading')
    expect(screen.getByRole('heading', { name: 'Quiénes somos', level: 2 })).not.toHaveClass('text-heading-1')
  })

  it('deja crecer el hero de Inicio y comparte el espaciado de sus secciones', () => {
    renderPublic()
    const main = screen.getByRole('main')
    const heroGrid = main.querySelector('section[aria-labelledby="hero-title"] > div')
    expect(heroGrid).toHaveClass('lg:min-h-[min(38rem,calc(100dvh-var(--size-header-desktop)))]')
    expect(heroGrid).not.toHaveClass('min-h-[calc(100dvh-var(--size-header-mobile))]')
    for (const id of ['quick-links-title', 'agenda-title', 'about-title', 'latest-news-title', 'transparency-title']) {
      expect(main.querySelector(`section[aria-labelledby="${id}"]`)).toHaveClass('public-section')
    }
  })

  it('comparte el espaciado de contenido en Nosotros, Comunidad y Servicios', () => {
    const { unmount: unmountAbout } = renderPublic('/nosotros')
    expect(screen.getByRole('heading', { name: 'Quiénes somos' }).closest('section')?.parentElement).toHaveClass('public-section')
    unmountAbout()

    const { unmount: unmountCommunity } = renderPublic('/comunidad')
    expect(screen.getByRole('heading', { name: 'Formas de participar' }).closest('section')?.parentElement).toHaveClass('public-section')
    unmountCommunity()

    renderPublic('/servicios')
    for (const title of ['Gestiones que puede iniciar en línea', 'Cómo funciona una solicitud', '¿Necesita orientación?']) {
      expect(screen.getByRole('heading', { name: title }).closest('section')).toHaveClass('public-section')
    }
  })

  it('expone variantes hero y simple con semántica de ruta accesible', () => {
    const { rerender } = render(<MemoryRouter><Breadcrumbs current="Nombre institucional muy extenso de Curime" variant="hero" /></MemoryRouter>)

    const hero = screen.getByRole('navigation', { name: 'Ruta de navegación' })
    expect(hero).toHaveClass('py-4')
    expect(within(hero).getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/')
    expect(within(hero).getByText('Nombre institucional muy extenso de Curime')).toHaveAttribute('aria-current', 'page')
    expect(hero.querySelector('svg')).toBeInTheDocument()

    rerender(<MemoryRouter><Breadcrumbs current="Contacto" variant="simple" /></MemoryRouter>)
    expect(screen.getByRole('navigation', { name: 'Ruta de navegación' })).toHaveClass('py-4', 'md:py-6')
  })

  it('integra un único breadcrumb hero antes del contenido comunitario', () => {
    renderPublic('/comunidad')

    const breadcrumb = screen.getByRole('navigation', { name: 'Ruta de navegación' })
    expect(breadcrumb).toHaveTextContent('Inicio')
    expect(within(breadcrumb).getByText('Comunidad')).toHaveAttribute('aria-current', 'page')
    expect(breadcrumb).not.toHaveClass('border-b')
  })

  it('muestra las siete áreas de Transparencia sin descargas ficticias', () => {
    renderPublic('/transparencia')
    const mainElement = screen.getByRole('main')
    const main = within(mainElement)
    const heroTitle = main.getByRole('heading', { name: 'Transparencia', level: 1 })
    const hero = heroTitle.closest('header')!
    expect(heroTitle).toBeVisible()
    expect(hero.querySelector('.public-container > .grid')).toHaveClass('lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.9fr)]')
    expect(within(hero).getByRole('navigation', { name: 'Ruta de navegación' })).toHaveTextContent('Inicio')
    expect(within(hero).getByText('Un espacio preparado para publicar información institucional cuando cuente con autorización de la Asociación.')).toBeVisible()
    expect(main.getByRole('img', { name: 'Paisaje rural de Curime, Guanacaste.' })).toHaveAttribute('src', '/images/public/home/hero-curime-fallback.jpg')
    const areas = main.getByRole('heading', { name: 'Áreas previstas de información' }).closest('section')!
    const groupsGrid = areas.querySelector('article')?.parentElement
    expect(groupsGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'xl:grid-cols-3')
    expect(areas.querySelectorAll('article')).toHaveLength(3)
    for (const title of ['Documentos públicos', 'Informes', 'Proyectos', 'Rendición de cuentas', 'Reportes administrativos', 'Reportes financieros autorizados', 'Información relacionada con DINADECO']) {
      expect(main.getByRole('heading', { name: title, level: 4 })).toBeVisible()
    }
    expect(main.getByRole('heading', { name: 'No hay documentos publicados por el momento' })).toBeVisible()
    expect(main.getByText('La información se publica únicamente cuando cuenta con autorización institucional. Cuando existan documentos disponibles, se mostrarán aquí con su información de consulta.')).toBeVisible()
    expect(main.getAllByText('En preparación')).toHaveLength(7)
    expect(main.getByText('Informes de gestión y resultados de la Asociación.')).toBeVisible()
    expect(main.getAllByRole('listitem')).toHaveLength(7)
    expect(main.getByRole('link', { name: 'Consultar información específica' })).toHaveAttribute('href', '/contacto')
    expect(main.getAllByRole('link')).toHaveLength(2) // Inicio del breadcrumb y consulta institucional.
    expect(mainElement.querySelector('a[href$=".pdf"]')).not.toBeInTheDocument()
  })

  it('mantiene fuera del listado las noticias pendientes y muestra el estado vacío', () => {
    renderPublic('/noticias')
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('heading', { name: 'Noticias', level: 1 })).toBeVisible()
    expect(main.getByRole('heading', { name: 'Comunicados publicados', level: 2 })).toHaveClass('public-heading')
    expect(main.getByRole('heading', { name: 'No hay noticias verificadas publicadas' })).toBeVisible()
    expect(main.getByText('Los comunicados y noticias oficiales aparecerán aquí cuando la Asociación los autorice.')).toBeVisible()
    expect(main.queryByRole('link', { name: /Canal informativo de ADI Curime/ })).not.toBeInTheDocument()
    expect(main.queryByRole('search')).not.toBeInTheDocument()
    expect(main.queryByRole('navigation', { name: /paginación/i })).not.toBeInTheDocument()
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
    expect(card).toHaveClass('h-full', 'min-w-0', 'rounded-surface')
    expect(card.parentElement).toHaveClass('grid', 'min-w-0', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
    expect(within(card).getByText('Comunidad')).toHaveClass('public-eyebrow', 'break-words')
    expect(within(card).getByText('20/10/2026')).toHaveClass('text-body-small', 'break-words')
    expect(within(card).getByRole('heading', { name: 'Comunicado de prueba', level: 3 })).toHaveClass('text-heading-3', 'leading-snug')
    expect(within(card).getByText('Resumen de prueba.')).toHaveClass('text-pretty', 'leading-relaxed')
    expect(within(card).getByRole('link', { name: 'Comunicado de prueba' })).toHaveAttribute('href', '/noticias/comunicado-de-prueba')
    expect(within(card).getByRole('link', { name: 'Leer noticia: Comunicado de prueba' })).toHaveAttribute('href', '/noticias/comunicado-de-prueba')
    expect(within(card).getByRole('link', { name: 'Leer noticia: Comunicado de prueba' })).toHaveClass('min-h-11', 'focus-visible:outline-3')
    expect(within(card).queryByRole('img')).not.toBeInTheDocument()
    expect(within(screen.getByRole('main')).queryByRole('search')).not.toBeInTheDocument()
    unmount()

    vi.spyOn(publicContentService, 'getNews').mockReturnValue(verified as unknown as ReturnType<typeof publicContentService.getNews>)
    renderPublic('/noticias/comunicado-de-prueba')
    expect(screen.getByRole('heading', { name: 'Comunicado de prueba', level: 1 })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Volver a noticias' })).toHaveAttribute('href', '/noticias')
  })

  it('presenta Nosotros sin publicar historia ni Junta Directiva sin validar', () => {
    renderPublic('/nosotros')
    const main = within(screen.getByRole('main'))
    const hero = main.getByRole('heading', { name: 'Conozca nuestra Asociación' }).closest('section')!
    const heroImage = hero.querySelector('img')!
    expect(hero).toHaveClass('w-full')
    expect(heroImage.parentElement?.parentElement).toHaveClass('w-full', 'border-y')
    expect(heroImage.parentElement?.parentElement).not.toHaveClass('rounded-surface')
    expect(hero.querySelector('[aria-hidden="true"].bg-gradient-to-b')).toHaveClass('from-surface-page/90', 'via-surface-page/65')
    expect(main.getByRole('heading', { name: 'Conozca nuestra Asociación' })).toBeVisible()
    expect(main.getByRole('img', { name: 'Paisaje rural de Curime, Guanacaste.' })).toHaveAttribute('src', '/images/public/home/hero-curime-fallback.jpg')
    expect(main.getByRole('heading', { name: 'Quiénes somos' })).toBeVisible()
    const aboutSection = main.getByRole('heading', { name: 'Quiénes somos' }).closest('section')!
    expect(aboutSection).toHaveClass('border-b')
    expect(aboutSection.querySelector('div.grid')).toHaveClass('lg:grid-cols-[minmax(0,0.9fr)_minmax(20rem,1.1fr)]')
    expect(within(aboutSection).getByText(/Contenido provisional\. La descripción oficial de la ADI de Curime/)).toBeVisible()
    expect(within(aboutSection).getByRole('img', { name: /Imagen provisional de una actividad comunitaria en Curime/ })).toHaveAttribute('src', '/images/public/home/community-curime-wide.webp')
    expect(within(aboutSection).getByText(/no es una fotografía institucional confirmada/i)).toBeVisible()
    expect(main.getByRole('heading', { name: 'Misión' })).toBeVisible()
    expect(main.getByText('Textos propuestos, pendientes de validación institucional.')).toBeVisible()
    expect(main.getByRole('heading', { name: 'Visión' })).toBeVisible()
    expect(main.getByRole('heading', { name: 'Objetivos' })).toBeVisible()
    expect(main.getByRole('heading', { name: 'Nuestra historia' })).toBeVisible()
    expect(main.getByText(/no se presentan hitos ni cronologías sin validación/i)).toBeVisible()
    expect(main.getByRole('list', { name: 'Línea de tiempo de la ADI de Curime' })).toBeVisible()
    expect(within(main.getByRole('list', { name: 'Línea de tiempo de la ADI de Curime' })).getByText('Fecha y acontecimiento pendientes de validación institucional.')).toBeVisible()
    expect(main.getByRole('heading', { name: 'Junta Directiva y Fiscalía' })).toBeVisible()
    expect(main.getByText(/Integrantes y cargos conforme a la información proporcionada/)).toBeVisible()
    expect(within(main.getByRole('list', { name: 'Integrantes de Junta Directiva y Fiscalía' })).getAllByRole('article')).toHaveLength(9)
    expect(main.queryByText('2001')).not.toBeInTheDocument()
  })

  it('presenta una línea de tiempo provisional y los nueve cargos de Junta Directiva y Fiscalía', () => {
    renderPublic('/nosotros')
    const main = within(screen.getByRole('main'))
    const timeline = main.getByRole('list', { name: 'Línea de tiempo de la ADI de Curime' })
    expect(timeline).toHaveClass('border-l-2', 'border-brand-accent/50')
    expect(within(timeline).getAllByRole('listitem')).toHaveLength(1)
    expect(within(timeline).getByText('Hito pendiente')).toBeVisible()

    const board = main.getByRole('heading', { name: 'Junta Directiva y Fiscalía' }).closest('section')!
    const boardGrid = main.getByRole('list', { name: 'Integrantes de Junta Directiva y Fiscalía' })
    const members = within(boardGrid).getAllByRole('article')
    expect(boardGrid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3')
    expect(members).toHaveLength(9)
    const expectedMembers = [
      ['Presidente', 'JOSE OLIVIER PEREZ PICADO'],
      ['Vicepresidente', 'GIOVANNI ANTONIO ELIZONDO HERRERA'],
      ['Tesorera', 'GLORIA SUSANA JUAREZ PEREZ'],
      ['Secretaria', 'MARIELA MATARRITA GARCIA'],
      ['Vocal 1', 'JOSUE MATARRITA GOMEZ'],
      ['Vocal 2', 'MARIA ALEJANDRA MATARRITA PEREZ'],
      ['Vocal 3', 'GLENDA VANESSA LOPEZ PEREZ'],
      ['Fiscal 1', 'RAYMER LOAICIGA GOMEZ'],
      ['Fiscal 2', 'MAUREEN YORLENY JUAREZ JUAREZ'],
    ]
    members.forEach((member, index) => {
      const [role, name] = expectedMembers[index]
      expect(within(member).getByText(role, { exact: true })).toBeVisible()
      expect(within(member).getByRole('heading', { name, level: 4 })).toBeVisible()
      expect(member.querySelector('img')).toBeNull()
    })
    expect(within(board).getByText(/No se indicó el período de vigencia/)).toBeVisible()
    expect(boardGrid.textContent).not.toMatch(/\b\d{9}\b/)
  })

  it('presenta Misión, Visión y Objetivos en bloques responsive con contenido pendiente de aprobación', () => {
    renderPublic('/nosotros')
    const main = within(screen.getByRole('main'))
    const section = main.getByRole('heading', { name: 'Misión, visión y objetivos' }).closest('section')!
    const cards = within(section).getAllByRole('article')
    expect(cards).toHaveLength(3)
    expect(cards[0].parentElement).toHaveClass('grid-cols-1', 'gap-4', 'md:grid-cols-3', 'md:gap-5')

    for (const title of ['Misión', 'Visión', 'Objetivos']) {
      const card = within(section).getByRole('heading', { name: title, level: 3 }).closest('article')!
      expect(card).toHaveClass('min-w-0', 'rounded-surface', 'border', 'bg-surface-card', 'p-5')
      expect(card.querySelector('[aria-hidden="true"]')).not.toBeNull()
      expect(within(card).getByText(/^(Promover|Ser una Asociación|Impulsar)/)).toBeVisible()
    }

    expect(within(section).getByText('Textos propuestos, pendientes de validación institucional.')).toBeVisible()
  })

  it('presenta Comunidad con accesos a los módulos existentes', () => {
    renderPublic('/comunidad')
    const main = screen.getByRole('main')
    const getSection = (selector: string) => {
      const heading = main.querySelector(selector)
      const section = heading?.closest('section')
      if (!section) throw new Error(`Falta la sección para ${selector}`)
      return section
    }
    const hero = getSection('#community-title')
    expect(hero.querySelector('.bg-brand-deep')).toBeInTheDocument()
    expect(hero.querySelector('.public-container.grid')).toHaveClass('grid', 'lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]')
    expect(hero.querySelector('nav[aria-label="Ruta de navegación"]')).toBeInTheDocument()
    expect(hero.querySelector('a[href="/contacto"]')?.textContent?.trim()).toBe('Contáctenos')
    expect(hero.querySelector('img')?.getAttribute('src')).toBe('/images/public/home/community-curime-fallback.jpg')
    expect(hero.querySelector('img')?.getAttribute('alt')).toContain('su carácter institucional no está confirmado')
    expect(hero.textContent).toContain('Imagen referencial')

    const actions = getSection('#community-actions')
    expect(actions.querySelector('article')?.parentElement).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4')
    const actionDestinations = Array.from(actions.querySelectorAll('article a')).map((link) => [link.textContent?.trim(), link.getAttribute('href')])
    expect(actionDestinations).toEqual([
      ['Ver eventos', '/eventos'],
      ['Ver oportunidades de voluntariado', '/voluntariado'],
      ['Ver emprendimientos', '/ventures'],
      ['Contactar a la ADI', '/contacto'],
    ])

    const projects = getSection('#community-areas')
    expect(projects.querySelector('[aria-label="Proyectos destacados"]')).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'xl:grid-cols-3')
    expect(projects.textContent).toContain('No hay proyectos confirmados para publicar')
    expect(projects.textContent).toContain('Los proyectos comunitarios aparecerán aquí cuando exista información aprobada para compartir.')
    expect(projects.querySelector('img')).not.toBeInTheDocument()

    const closing = getSection('#community-notice')
    expect(closing.querySelector('a')?.getAttribute('href')).toBe('/contacto')
    const orderedSections = Array.from(main.querySelectorAll('section[aria-labelledby^="community-"]'))
    expect(orderedSections.map((section) => section.getAttribute('aria-labelledby'))).toEqual([
      'community-title', 'community-actions', 'community-areas', 'community-notice',
    ])
  })

  it('muestra servicios disponibles y orienta a visitantes antes de reservar', () => {
    render(<MemoryRouter><main><ServicesPage /></main></MemoryRouter>)

    const mainElement = screen.getByRole('main')
    const getRequiredElement = (container: ParentNode, selector: string) => {
      const element = container.querySelector(selector)
      if (!element) throw new Error(`No se encontró el elemento ${selector}`)
      return element
    }
    expect(mainElement.querySelector('#services-title')).toHaveTextContent('Servicios para la comunidad')
    expect(mainElement.querySelector('img[alt="Paisaje rural de Curime, Guanacaste."]')).toHaveAttribute('src', '/images/public/home/hero-curime-fallback.jpg')
    expect(mainElement.querySelector('#available-services-title')).toHaveTextContent('Gestiones que puede iniciar en línea')

    const heroSection = getRequiredElement(mainElement, '#services-title').closest('section')!
    const processSection = getRequiredElement(mainElement, '#service-process-title').closest('section')!
    const cardsSection = getRequiredElement(mainElement, '#available-services-title').closest('section')!
    const sections = Array.from(mainElement.querySelectorAll(':scope > section'))
    expect(sections.indexOf(processSection)).toBe(sections.indexOf(heroSection) + 1)
    expect(sections.indexOf(cardsSection)).toBe(sections.indexOf(processSection) + 1)
    const processList = processSection.querySelector('ol')!
    expect(processList.querySelectorAll(':scope > li')).toHaveLength(3)
    expect(Array.from(processList.querySelectorAll(':scope > li')).map((step) => step.textContent?.replace(/^\s*\d\s*/, '').trim())).toEqual([
      'Seleccione una gestión', 'Complete o consulte la información', 'Revise y confirme cuando corresponda',
    ])
    expect(processList).toHaveClass('grid', 'gap-5', 'sm:grid-cols-3')

    const serviceGrid = cardsSection.querySelector('article')?.parentElement as HTMLElement
    expect(serviceGrid).toHaveClass('grid', 'gap-4', 'md:grid-cols-2', 'lg:grid-cols-3')
    const getCard = (title: string) => {
      const card = Array.from(serviceGrid.querySelectorAll(':scope > article')).find((candidate) => candidate.querySelector('h3')?.textContent?.trim() === title)
      if (!card) throw new Error(`No se encontró la tarjeta ${title}`)
      return card
    }
    const expectServiceCard = (card: HTMLElement, description: string, steps: string[]) => {
      expect(card.textContent).toContain('Disponible')
      expect(card.querySelector('p')).toHaveTextContent(description)
      expect(card.querySelector('p')).toHaveClass('text-body-small', 'leading-relaxed')
      const stepList = card.querySelector('ol')!
      expect(stepList).toHaveClass('grid', 'gap-2', 'xl:grid-cols-3')
      const stepItems = Array.from(stepList.querySelectorAll('li'))
      expect(stepItems).toHaveLength(3)
      expect(stepItems.map((step) => step.querySelector('span:last-child')?.textContent?.trim())).toEqual(steps)
      for (const step of stepItems) {
        expect(step).toHaveClass('min-w-0', 'items-center', 'xl:flex-col', 'xl:text-center')
      }
    }

    const affiliation = getCard('Afiliación')
    expectServiceCard(affiliation, 'Envíe sus datos de identidad, contacto y residencia. La Asociación revisará la solicitud; enviarla no aprueba la afiliación.', ['Complete sus datos', 'Envíe la solicitud', 'Espere revisión'])
    expect(affiliation.querySelector('h3')).toHaveClass('text-heading-3')
    expect(affiliation.querySelector('[aria-hidden="true"]')).not.toBeNull()
    expect(affiliation.querySelector('a[href="/afiliacion"]')).toHaveTextContent('Solicitar afiliación')

    const reservations = getCard('Reservas')
    expectServiceCard(reservations, 'Indique espacio, fecha, horario y motivo. Consultar disponibilidad no confirma la reserva.', ['Elija espacio y horario', 'Consulte disponibilidad', 'Revise y envíe'])
    expect(reservations.querySelector('a[href="/login"]')).toHaveTextContent('Iniciar sesión')
    expect(reservations.querySelector('a[href="/register"]')).toHaveTextContent('Crear una cuenta')

    const entrepreneurship = getCard('Emprendimientos')
    expectServiceCard(entrepreneurship, 'Consulte los emprendimientos publicados y sus detalles en el directorio, sin iniciar sesión.', ['Abra el directorio', 'Busque una iniciativa', 'Consulte detalles'])
    expect(entrepreneurship.querySelector('a[href="/ventures"]')).toHaveTextContent('Ver emprendimientos')

    const volunteering = getCard('Voluntariado')
    expectServiceCard(volunteering, 'Revise las oportunidades publicadas y envíe su postulación. No requiere crear una cuenta y queda pendiente de revisión.', ['Vea oportunidades', 'Elija una actividad', 'Envíe su postulación'])
    expect(volunteering.querySelector('a[href="/voluntariado"]')).toHaveTextContent('Ver oportunidades')

    const donations = getCard('Donaciones')
    expectServiceCard(donations, 'Indique su intención de donar dinero o bienes. La Asociación revisará la solicitud; el portal no procesa pagos ni confirma recepción.', ['Describa su aporte', 'Envíe la solicitud', 'Espere coordinación'])
    expect(donations.querySelector('a[href="/donaciones"]')).toHaveTextContent('Donar')
    expect(donations.querySelector('a[href="/donaciones"]')).not.toHaveTextContent('Solicitar una donación')

    const orientation = getRequiredElement(mainElement, '#services-help-title').closest('section')!
    expect(orientation.textContent).toMatch(/cree una cuenta o inicie sesión para continuar/)
    expect(orientation.querySelector('a[href="/contacto"]')).toHaveTextContent('Contactar a la Asociación')
    expect(orientation.querySelector('a[href="/register"]')).toHaveTextContent('Crear una cuenta')
    expect(orientation.querySelector('a[href="/login"]')).toHaveTextContent('Iniciar sesión')
    expect(serviceGrid.querySelectorAll(':scope > article')).toHaveLength(5)

    for (const title of ['Afiliación', 'Reservas', 'Voluntariado', 'Emprendimientos', 'Donaciones']) {
      const card = getCard(title)
      expect(card).toHaveClass('h-full', 'min-w-0', 'flex-col', 'shadow-sm', 'transition-[border-color,box-shadow]', 'duration-200', 'motion-reduce:transition-none', 'hover:border-brand-primary', 'hover:shadow-md', 'focus-within:border-brand-primary', 'focus-within:shadow-md')
      expect(card).not.toHaveClass('hover:-translate-y-1', 'hover:scale-105')
    }
    const cardActions = Array.from(serviceGrid.querySelectorAll('a'))
    expect(cardActions).toHaveLength(6)
    for (const action of cardActions) {
      expect(action).toHaveClass('duration-200', 'motion-reduce:transition-none', 'hover:shadow-sm', 'focus-visible:outline-3', 'focus-visible:outline-ring')
    }
    expect(mainElement.querySelector('a[href="#servicios-disponibles"]')).toHaveClass('motion-reduce:transition-none', 'focus-visible:outline-3')
    expect(orientation.querySelector('a[href="/contacto"]')).toHaveClass('motion-reduce:transition-none', 'focus-visible:outline-3')
    expect(serviceGrid.querySelectorAll('a[href="/register"]')).toHaveLength(1)
    expect(serviceGrid.querySelectorAll('a[href="/login"]')).toHaveLength(1)
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
    expect(screen.queryByRole('link', { name: 'Crear una cuenta' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Iniciar sesión' })).not.toBeInTheDocument()
    expect(within(screen.getByRole('main')).getAllByRole('article')).toHaveLength(5)
    expect(within(screen.getByRole('heading', { name: 'Donaciones' }).closest('article')!).getByRole('link', { name: 'Donar' })).toHaveAttribute('href', '/donaciones')
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
    expect(screen.getAllByRole('button', { name: 'Ir al panel' }).some((button) => button.getAttribute('href') === '/app')).toBe(true)
    expect(within(screen.getByRole('contentinfo')).getByRole('link', { name: 'Ir al panel' })).toHaveAttribute('href', '/app')
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
      'Lo que puede hacer hoy',
      'Próximas actividades',
      'Un pueblo unido, un futuro compartido',
      'Lo más reciente',
      'Información pública para la comunidad',
    ])
  })

  it('muestra accesos comunitarios y noticias con rutas existentes', () => {
    renderPublic()
    expect(screen.getByRole('heading', { name: /lo que puede hacer hoy/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /afiliación/i })).toHaveAttribute('href', '/afiliacion')
    expect(screen.getByRole('link', { name: /ver agenda completa/i })).toHaveAttribute('href', '/eventos')
    const communityAccess = within(screen.getByRole('navigation', { name: 'Accesos comunitarios' }))
    expect(communityAccess.getByRole('link', { name: /emprendimientos/i })).toHaveAttribute('href', '/ventures')
    expect(screen.getByRole('link', { name: /ver todo/i })).toHaveAttribute('href', '/noticias')
    expect(screen.getByRole('heading', { name: /lo más reciente/i })).toBeInTheDocument()
    expect(communityAccess.getByRole('link', { name: /reservas/i })).toHaveAttribute('href', '/servicios')
  })

  it('separa acceso público e inicio de sesión', () => {
    renderPublic()
    const navigation = within(screen.getByRole('navigation', { name: 'Navegación pública' }))
    expect(navigation.getByRole('link', { name: 'Servicios' })).toHaveAttribute('href', '/servicios')
    expect(navigation.getByRole('link', { name: 'Transparencia' })).toHaveAttribute('href', '/transparencia')
    expect(navigation.queryByRole('button', { name: 'Servicios' })).not.toBeInTheDocument()
    const footer = within(screen.getByRole('contentinfo'))
    expect(footer.getByRole('heading', { name: 'Sistema' })).toBeInTheDocument()
    expect(footer.getByRole('navigation', { name: 'Acceso al sistema' })).toBeInTheDocument()
  })

  it('ofrece iniciar sesión a visitantes', () => {
    renderPublic()
    const actions = within(screen.getAllByRole('banner')[0]).getAllByRole('button', { name: 'Iniciar sesión' })
    expect(actions).not.toHaveLength(0)
    actions.forEach((action) => expect(action).toHaveAttribute('href', '/login'))
    expect(within(screen.getByRole('contentinfo')).getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login')
  })

  it('muestra los canales oficiales con enlaces accesibles y seguros', () => {
    renderPublic('/contacto')
    const contact = within(screen.getByRole('main'))
    const instagramCard = contact.getByRole('heading', { name: 'Instagram' }).closest('article')!
    expect(instagramCard).toHaveClass('h-full', 'min-w-0', 'rounded-surface')
    expect(instagramCard.parentElement).toHaveClass('grid', 'min-w-0', 'sm:grid-cols-2', 'xl:grid-cols-3')
    const formHeading = contact.getByRole('heading', { name: 'Preparar una consulta' })
    const formPanel = formHeading.closest('section')?.parentElement
    expect(formPanel).toHaveClass('min-w-0', 'rounded-surface')
    expect(formPanel?.parentElement).toHaveClass('grid', 'min-w-0', 'lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.2fr)]')

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

    expect(contact.getByRole('heading', { name: 'Ubicación' })).toBeVisible()
    expect(contact.getByText('Curime, Guanacaste, Costa Rica')).toBeVisible()
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
    expect(firstName.closest('[data-slot="form-field"]')?.parentElement).toHaveClass('grid', 'min-w-0', 'sm:grid-cols-2')
    expect(email).toHaveAttribute('autocomplete', 'email')
    expect(firstName).toHaveAttribute('required')
    expect(email).toHaveClass('min-w-0', 'focus-visible:ring-3')
    const submitButton = contact.getByRole('button', { name: 'Revisar consulta' })
    expect(submitButton).toBeVisible()
    expect(submitButton).toHaveClass('w-full', 'focus-visible:ring-3')
    expect(contact.getByText(/no envía mensajes automáticamente/i)).toBeVisible()

    fireEvent.click(contact.getByRole('button', { name: 'Revisar consulta' }))

    expect(firstName).toHaveAttribute('aria-invalid', 'true')
    expect(lastNames).toHaveAttribute('aria-invalid', 'true')
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(subject).toHaveAttribute('aria-invalid', 'true')
    expect(message).toHaveAttribute('aria-invalid', 'true')
    expect(contact.getAllByRole('alert')).toHaveLength(5)
    expect(document.getElementById(email.getAttribute('aria-describedby')!)).toHaveAttribute('role', 'alert')
    expect(contact.queryByText(/enviado correctamente/i)).not.toBeInTheDocument()
  })

  it('prepara una consulta válida sin indicar que fue enviada o recibida', () => {
    renderPublic('/contacto')
    const contact = within(screen.getByRole('main'))
    fireEvent.change(contact.getByLabelText(/^Nombre/), { target: { value: 'Ana' } })
    fireEvent.change(contact.getByLabelText(/^Apellidos/), { target: { value: 'Solano' } })
    fireEvent.change(contact.getByLabelText(/^Correo electrónico/), { target: { value: 'ana@example.com' } })
    fireEvent.change(contact.getByLabelText(/^Asunto/), { target: { value: 'Consulta general' } })
    fireEvent.change(contact.getByLabelText(/^Mensaje/), { target: { value: 'Quisiera consultar información general.' } })
    fireEvent.click(contact.getByRole('button', { name: 'Revisar consulta' }))

    expect(contact.getByRole('status')).toHaveTextContent('Su consulta no se ha enviado')
    expect(contact.queryByText(/enviado correctamente|recibido por la Asociación/i)).not.toBeInTheDocument()
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
