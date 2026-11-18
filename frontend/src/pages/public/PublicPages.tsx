import { Link, Navigate, useParams } from "react-router-dom";
import { BarChart3, Building2, CalendarDays, ClipboardList, FileText, FolderOpen, HandHeart, Landmark, Mail, MapPin, Newspaper, Target, UsersRound, type LucideIcon } from "lucide-react";
import { moduleAvailability, services, site } from "../../content/publicSiteContent";
import { publicContentService } from "../../services/publicContentService";
import {
  Breadcrumbs,
  EmptyContentState,
  NewsCard,
  PublicPageHeader,
  SectionContainer,
  Seo,
} from "../../components/public/PublicComponents";
import { useAuth } from "@/features/auth";
import { ContactForm } from "@/features/public-site";
import { CategoryIcon, type CategoryIconGlyph } from "@/shared/ui/CategoryIcon";
import { publicCategories } from "@/shared/ui/publicCategories";
import { SocialIcon } from "@/shared/ui/SocialIcon";

const transparencyGroups = [
  { title: 'Información pública', items: ['Documentos públicos', 'Informes', 'Proyectos'] },
  { title: 'Rendición de cuentas', items: ['Rendición de cuentas', 'Reportes administrativos', 'Reportes financieros autorizados'] },
  { title: 'Marco institucional', items: ['Información relacionada con DINADECO'] },
] as const;
const boardMembers = [
  { role: 'Presidente', name: 'JOSE OLIVIER PEREZ PICADO' },
  { role: 'Vicepresidente', name: 'GIOVANNI ANTONIO ELIZONDO HERRERA' },
  { role: 'Tesorera', name: 'GLORIA SUSANA JUAREZ PEREZ' },
  { role: 'Secretaria', name: 'MARIELA MATARRITA GARCIA' },
  { role: 'Vocal 1', name: 'JOSUE MATARRITA GOMEZ' },
  { role: 'Vocal 2', name: 'MARIA ALEJANDRA MATARRITA PEREZ' },
  { role: 'Vocal 3', name: 'GLENDA VANESSA LOPEZ PEREZ' },
  { role: 'Fiscal 1', name: 'RAYMER LOAICIGA GOMEZ' },
  { role: 'Fiscal 2', name: 'MAUREEN YORLENY JUAREZ JUAREZ' },
] as const;

const InstagramChannelIcon: CategoryIconGlyph = ({ className }) => <SocialIcon platform="instagram" className={className} />;
const FacebookChannelIcon: CategoryIconGlyph = ({ className }) => <SocialIcon platform="facebook" className={className} />;

export function AboutPage() {
  // TODO: sustituir estas propuestas por las declaraciones oficiales aprobadas por la ADI de Curime.
  const identityCards = [
    { title: "Misión", icon: Target, description: "Promover el desarrollo integral de la comunidad de Curime mediante proyectos y servicios que generen bienestar y oportunidades para todas las personas." },
    { title: "Visión", icon: Building2, description: "Ser una Asociación reconocida por su liderazgo, transparencia y capacidad de gestión, contribuyendo al desarrollo sostenible de Curime y sus alrededores." },
    { title: "Objetivos", icon: HandHeart, description: "Impulsar el desarrollo social, económico y cultural, fortalecer la participación comunal y administrar los recursos con eficiencia y transparencia." },
  ] as const;
  return (
    <>
      <Seo title="Nosotros" description="Conozca el espacio institucional de ADI Curime." />
      <section className="w-full" aria-labelledby="about-title">
        <div className="public-container"><Breadcrumbs current="Nosotros" variant="hero" /></div>
        <div className="relative isolate w-full overflow-hidden border-y border-border/70 bg-surface-page">
          <picture className="absolute inset-0">
            <source media="(max-width: 767px)" srcSet="/images/public/home/hero-curime-mobile.webp" type="image/webp" />
            <source srcSet="/images/public/home/hero-curime-wide.webp" type="image/webp" />
            <img src="/images/public/home/hero-curime-fallback.jpg" alt="Paisaje rural de Curime, Guanacaste." width="1600" height="1200" className="size-full object-cover object-[58%_59%]" />
          </picture>
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-surface-page/90 via-surface-page/65 to-surface-page/25 lg:bg-gradient-to-r lg:from-surface-page/90 lg:via-surface-page/65 lg:to-transparent" />
          <div className="public-container relative flex min-h-[22rem] items-center py-12 md:min-h-[25rem] md:py-14 lg:min-h-[28rem] xl:min-h-[30rem]">
            <div className="max-w-xl lg:max-w-[35rem]">
              <p className="public-eyebrow text-brand-primary">ADI Curime · Nicoya · Guanacaste</p>
              <h1 id="about-title" className="public-heading mt-4 text-heading-1 text-text-primary">Conozca nuestra <span className="block">Asociación</span></h1>
              <p className="mt-5 text-body-large leading-relaxed text-foreground-muted">Trabajamos por el desarrollo integral de nuestra comunidad, con transparencia y compromiso.</p>
              <div aria-hidden="true" className="mt-6 h-1 w-16 bg-brand-accent" />
            </div>
          </div>
        </div>
      </section>
      <SectionContainer spacing="spacious" className="space-y-10 md:space-y-16">
        <section aria-labelledby="about-intro" className="border-b border-border/70 pb-10 lg:pb-14">
          <div className="grid min-w-0 gap-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(20rem,1.1fr)] lg:items-center lg:gap-12">
            <div className="min-w-0">
              <p className="public-eyebrow text-brand-primary">La Asociación</p>
              <h2 id="about-intro" className="public-heading mt-3 text-text-primary">Quiénes somos</h2>
              <p className="mt-4 text-body-large leading-relaxed text-foreground-muted">Contenido provisional. La descripción oficial de la ADI de Curime se incorporará cuando sea aprobada por la Asociación.</p>
            </div>
            <figure className="min-w-0 overflow-hidden rounded-surface border border-border/70 bg-surface-muted shadow-surface">
              <picture className="block aspect-[4/3] w-full">
                <img src="/images/public/home/community-curime-wide.webp" alt="Imagen provisional de una actividad comunitaria en Curime; no se ha confirmado como fotografía oficial de la ADI." width="1500" height="1000" loading="lazy" className="size-full object-cover" />
              </picture>
              <figcaption className="px-4 py-3 text-body-small text-foreground-muted">Imagen provisional de la comunidad; no es una fotografía institucional confirmada.</figcaption>
            </figure>
          </div>
          {/* TODO: sustituir el contenido provisional por la descripción oficial aprobada por la ADI de Curime. */}
        </section>
        <section aria-labelledby="identity-title">
          <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(14rem,4fr)_minmax(0,6fr)] lg:items-end lg:gap-12"><div><p className="public-eyebrow text-brand-primary">Nuestra orientación</p><h2 id="identity-title" className="public-heading mt-3 text-text-primary">Misión, visión y objetivos</h2></div><p className="max-w-2xl text-pretty text-body leading-relaxed text-foreground-muted">Textos propuestos, pendientes de validación institucional.</p></div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">{identityCards.map(({ title, icon: Icon, description }) => <article key={title} className="min-w-0 rounded-surface border border-border/70 bg-surface-card p-5 shadow-sm md:p-6"><CategoryIcon icon={Icon} tone="institutional" size="lg" /><h3 className="mt-5 font-heading text-heading-3 text-text-primary">{title}</h3><p className="mt-3 text-body-small leading-relaxed text-foreground-muted">{description}</p></article>)}</div>
        </section>
        <section aria-labelledby="notice-title" className="space-y-8">
          <header>
            <p className="public-eyebrow text-brand-primary">Información pendiente</p>
            <h2 id="notice-title" className="public-heading mt-3 text-text-primary">Historia, Junta Directiva y Fiscalía</h2>
            <p className="mt-3 max-w-2xl text-pretty text-body leading-relaxed text-foreground-muted">Publicar solo información institucional validada.</p>
          </header>

          <section aria-labelledby="history-title" className="rounded-surface border border-border/70 bg-surface-muted p-5 sm:p-6 md:p-8">
            <div className="flex items-start gap-4">
              <CategoryIcon icon={CalendarDays} tone="institutional" size="lg" />
              <div className="min-w-0">
                <p className="public-eyebrow text-brand-primary">Cronología institucional</p>
                <h3 id="history-title" className="font-heading text-heading-3 text-text-primary">Nuestra historia</h3>
                <p className="mt-3 max-w-3xl text-body leading-relaxed text-foreground-muted">La historia institucional se publicará cuando las fechas y acontecimientos hayan sido revisados con la ADI. Por ahora, no se presentan hitos ni cronologías sin validación.</p>
              </div>
            </div>
            {/* TODO: agregar fechas y acontecimientos solo después de su verificación oficial con la ADI. */}
            <ol aria-label="Línea de tiempo de la ADI de Curime" className="relative ml-5 mt-7 border-l-2 border-brand-accent/50 pl-7 sm:ml-6 sm:pl-8">
              <li className="relative min-w-0">
                <span aria-hidden="true" className="absolute -left-[2.15rem] top-1 grid size-4 place-items-center rounded-full border-4 border-surface-muted bg-brand-primary sm:-left-[2.4rem]" />
                <div className="rounded-surface border border-border/70 bg-surface-card p-4 sm:p-5">
                  <p className="public-eyebrow text-brand-primary">Hito pendiente</p>
                  <p className="mt-2 text-body leading-relaxed text-foreground-muted">Fecha y acontecimiento pendientes de validación institucional.</p>
                </div>
              </li>
            </ol>
          </section>

          <section aria-labelledby="governance-title" className="rounded-surface border border-border/70 bg-surface-muted p-5 sm:p-6 md:p-8">
            <div className="flex items-start gap-4">
              <CategoryIcon icon={UsersRound} tone="institutional" size="lg" />
              <div className="min-w-0">
                <p className="public-eyebrow text-brand-primary">Integración institucional</p>
                <h3 id="governance-title" className="font-heading text-heading-3 text-text-primary">Junta Directiva y Fiscalía</h3>
                <p className="mt-3 max-w-3xl text-body leading-relaxed text-foreground-muted">Integrantes y cargos conforme a la información proporcionada. No se indicó el período de vigencia.</p>
              </div>
            </div>
            {/* TODO: añadir fotografías oficiales cuando estén disponibles. */}
            <ul className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Integrantes de Junta Directiva y Fiscalía">
              {boardMembers.map(({ role, name }) => <li key={role} className="min-w-0">
                <article className="h-full min-w-0 rounded-surface border border-border/70 bg-surface-card p-5 shadow-sm">
                  <p className="text-body-small font-semibold text-brand-primary">{role}</p>
                  <h4 className="mt-2 break-words text-body-large font-semibold text-text-primary">{name}</h4>
                </article>
              </li>)}
            </ul>
          </section>
        </section>
        <section aria-labelledby="about-participation" className="rounded-surface bg-brand-deep px-6 py-8 text-white md:px-10 md:py-10"><p className="public-eyebrow text-brand-accent">Formar parte</p><div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-10"><div><h2 id="about-participation" className="font-heading text-heading-2 font-normal text-white">Conozca las formas de participación</h2><p className="mt-3 max-w-2xl text-body leading-relaxed text-white/80">Explore oportunidades, actividades y canales oficiales de la Asociación sin asumir funciones, cargos o procesos aún no publicados.</p></div><Link to="/comunidad" className="inline-flex min-h-11 items-center justify-center rounded-control bg-brand-accent px-5 font-semibold text-brand-deep transition-colors hover:bg-brand-soft focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-accent">Ir a comunidad</Link></div></section>
      </SectionContainer>
    </>
  );
}
export function CommunityPage() {
  const communityActions = [
    { ...publicCategories.events, title: 'Eventos', description: 'Consulte las actividades comunicadas oficialmente por la Asociación.', to: '/eventos', label: 'Ver eventos' },
    { ...publicCategories.volunteering, title: 'Voluntariado', description: 'Explore oportunidades de participación publicadas.', to: '/voluntariado', label: 'Ver oportunidades de voluntariado' },
    { ...publicCategories.entrepreneurship, title: 'Emprendimientos', description: 'Conozca los emprendimientos locales publicados.', to: '/ventures', label: 'Ver emprendimientos' },
    { ...publicCategories.contact, title: 'Contacto', description: 'Use los canales oficiales para consultar a la Asociación.', to: '/contacto', label: 'Contactar a la ADI' },
  ] as const;

  return (
    <>
      <Seo title="Comunidad" description="Espacio comunitario de Curime." />
      <section aria-labelledby="community-title" className="border-b border-border/70">
        <div className="bg-surface-page">
          <div className="public-container"><Breadcrumbs current="Comunidad" variant="hero" /></div>
        </div>
        <div className="overflow-hidden bg-background-subtle text-foreground-primary">
          <div className="public-container grid gap-7 py-8 sm:py-10 lg:min-h-[34rem] lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-stretch lg:gap-10 lg:py-0">
            <div className="flex min-w-0 flex-col items-start justify-center lg:py-12">
              <p className="public-eyebrow text-brand-brown">Vida comunitaria</p>
              <h1 id="community-title" className="public-heading mt-4 max-w-xl text-heading-1 text-foreground-primary">Un espacio para encontrarnos</h1>
              <p className="mt-5 max-w-xl text-pretty text-body-large leading-relaxed text-foreground-secondary">Conozca los espacios, actividades e iniciativas que fortalecen la participación y el encuentro en Curime.</p>
              <Link to="/contacto" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-control bg-brand-green px-6 py-3 font-bold text-white transition-colors hover:bg-interaction-primary-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-focus">Contáctenos</Link>
            </div>
            <figure className="relative min-w-0 overflow-hidden rounded-surface bg-surface-muted aspect-[16/10] lg:my-8 lg:aspect-auto">
              <picture className="block size-full"><source media="(max-width: 767px)" srcSet="/images/public/home/community-curime-mobile.webp" type="image/webp" /><source srcSet="/images/public/home/community-curime-wide.webp" type="image/webp" /><img src="/images/public/home/community-curime-fallback.jpg" alt="Imagen referencial de un espacio comunitario; su carácter institucional no está confirmado." width="1500" height="1000" className="size-full object-cover object-[50%_42%]" /></picture>
              <figcaption className="absolute bottom-3 left-3 rounded-full bg-brand-deep/90 px-3 py-1 text-caption font-semibold text-white">Imagen referencial</figcaption>
            </figure>
          </div>
        </div>
      </section>
      <SectionContainer spacing="spacious" className="space-y-10 md:space-y-16">
        <section aria-labelledby="community-actions">
          <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(14rem,4fr)_minmax(0,6fr)] lg:items-end lg:gap-12"><div><p className="public-eyebrow text-brand-primary">Explore la comunidad</p><h2 id="community-actions" className="public-heading mt-3 text-text-primary">Formas de participar</h2></div><p className="max-w-2xl text-pretty text-body leading-relaxed text-foreground-muted">Acceda a actividades, oportunidades y canales comunitarios ya disponibles en el portal.</p></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{communityActions.map(({ title, description, icon: Icon, tone, to, label }) => <article key={title} className="flex min-h-full flex-col rounded-surface border border-border/70 bg-surface-card p-5 shadow-sm"><CategoryIcon icon={Icon} tone={tone} size="lg" /><h3 className="mt-5 font-heading text-heading-3 text-text-primary">{title}</h3><p className="mt-2 text-body-small leading-relaxed text-foreground-muted">{description}</p><Link to={to} className="mt-5 inline-flex min-h-11 items-center font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">{label}</Link></article>)}</div>
        </section>
        <section aria-labelledby="community-areas" className="space-y-6 border-y border-border/70 py-8 md:py-10">
          <header className="grid gap-4 lg:grid-cols-[minmax(14rem,4fr)_minmax(0,6fr)] lg:items-end lg:gap-12">
            <div><p className="public-eyebrow text-brand-primary">Vida comunitaria</p><h2 id="community-areas" className="public-heading mt-3 text-text-primary">Iniciativas y proyectos</h2></div>
            <p className="max-w-2xl text-pretty text-body leading-relaxed text-foreground-muted">Una comunidad que crece en conjunto. Este espacio reúne información sobre iniciativas, proyectos y actividades comunitarias de Curime. Algunos contenidos se encuentran en preparación.</p>
          </header>
          {/* TODO: reemplazar el estado vacío por tarjetas solo cuando haya proyectos e imágenes aprobados por la ADI. */}
          <div aria-label="Proyectos destacados" className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            <div className="min-w-0 md:col-span-2 xl:col-span-3">
              <EmptyContentState title="No hay proyectos confirmados para publicar" text="Los proyectos comunitarios aparecerán aquí cuando exista información aprobada para compartir." />
            </div>
          </div>
        </section>
        <section aria-labelledby="community-notice" className="grid gap-6 rounded-surface bg-brand-deep p-6 text-white md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-9"><div><p className="public-eyebrow text-brand-accent">Información verificada</p><h2 id="community-notice" className="mt-3 font-heading text-heading-2 text-white">Proyectos y galerías se publican cuando están autorizados</h2><p className="mt-3 max-w-2xl text-body leading-relaxed text-white/80">Si desea consultar una iniciativa, actividad o proyecto, use los canales oficiales de la Asociación.</p></div><Link to="/contacto" className="inline-flex min-h-11 items-center justify-center rounded-control bg-surface-page px-5 font-semibold text-brand-deep transition-colors hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-brand-accent">Contactar a la ADI</Link></section>
      </SectionContainer>
    </>
  );
}
export function NewsPage() {
  const verifiedNews = publicContentService.listNews().filter((item) => item.date !== 'Próximamente');
  return (
    <>
      <Seo title="Noticias" description="Noticias y comunicados verificados de ADI Curime." />
      <header className="border-b border-border/70 bg-surface-muted">
        <div className="public-container pb-7 md:pb-10">
          <Breadcrumbs current="Noticias" variant="simple" />
          <div className="grid gap-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="max-w-2xl">
              <p className="public-eyebrow text-brand-primary">ADI Curime · Actualidad</p>
              <h1 className="public-heading mt-4 text-heading-1 text-text-primary">Noticias</h1>
              <p className="mt-5 text-pretty text-body-large leading-relaxed text-foreground-muted">Comunicados y novedades oficiales de la Asociación, publicados después de su verificación.</p>
            </div>
            <span aria-hidden="true" className="hidden size-28 place-items-center rounded-surface border border-border/70 bg-surface-card text-brand-primary md:grid"><Newspaper className="size-12" strokeWidth={1.4} /></span>
          </div>
        </div>
      </header>
      <SectionContainer className="space-y-8 md:space-y-10" spacing="spacious">
        <section aria-labelledby="published-news-title" className="min-w-0 space-y-6 md:space-y-8">
          <header>
            <p className="public-eyebrow text-brand-primary">Información verificada</p>
            <h2 id="published-news-title" className="public-heading mt-3 text-text-primary">Comunicados publicados</h2>
          </header>
          {verifiedNews.length === 0
            ? <div className="grid min-w-0 items-center gap-5 rounded-surface border border-border/70 bg-surface-page p-5 md:grid-cols-[auto_minmax(0,1fr)] md:p-8">
              <CategoryIcon icon={publicCategories.news.icon} tone="news" size="lg" />
              <EmptyContentState title="No hay noticias verificadas publicadas" text="Los comunicados y noticias oficiales aparecerán aquí cuando la Asociación los autorice." />
            </div>
            : <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
              {verifiedNews.map((item) => <NewsCard key={item.slug} item={item} />)}
            </div>}
        </section>
        <aside className="flex min-w-0 flex-col gap-4 border-t border-border/70 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-pretty text-body-small leading-relaxed text-foreground-muted">La Asociación publica únicamente comunicados y novedades que hayan sido revisados como información oficial.</p>
          <Link to="/contacto" className="inline-flex min-h-11 max-w-full shrink-0 items-center justify-center self-start break-words rounded-control border border-brand-deep px-4 text-center font-semibold text-brand-deep transition-colors hover:bg-brand-deep hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring sm:self-auto">Consultar canales oficiales</Link>
        </aside>
      </SectionContainer>
    </>
  );
}
export function NewsDetailPage() {
  const { slug } = useParams();
  const item = slug ? publicContentService.getNews(slug) : undefined;
  if (!item) return <Navigate to="/noticias" replace />;
  const isPending = item.date === 'Próximamente';
  return (
    <>
      <Seo title={isPending ? 'Noticia en preparación' : item.title} description={isPending ? 'Contenido pendiente de autorización institucional.' : item.excerpt} />
      <div className="public-container"><Breadcrumbs current="Noticias" variant="simple" /></div>
      <SectionContainer className="max-w-3xl">
        {isPending ? <><EmptyContentState title="Esta noticia está en preparación" text="El contenido de esta ruta aún no corresponde a un comunicado publicado. Consulte el listado de noticias para futuras publicaciones autorizadas." /><Link className="mt-6 inline-flex min-h-11 items-center font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring" to="/noticias">Volver a noticias</Link></> : <>
        <p className="public-eyebrow text-brand-primary">
          {item.category} · {item.date}
        </p>
        <h1 className="public-heading mt-4 text-heading-1 text-text-primary">{item.title}</h1>
        <p className="mt-5 text-body-large leading-relaxed text-foreground-muted">{item.excerpt}</p>
        <div className="mt-8 border-y border-border/70 py-7 text-body leading-relaxed text-foreground-secondary"><p>{item.body}</p></div>
        <Link className="mt-6 inline-flex min-h-11 items-center font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring" to="/noticias">Volver a noticias</Link>
        </>}
      </SectionContainer>
    </>
  );
}
export function ServicesPage() {
  const { isAuthenticated } = useAuth();
  const serviceActions = {
    affiliation: [{ label: "Solicitar afiliación", to: "/afiliacion" }],
    reservations: isAuthenticated
      ? [{ label: "Solicitar una reserva", to: "/servicios/reservas" }]
      : [
          { label: "Iniciar sesión", to: "/login" },
          { label: "Crear una cuenta", to: "/register" },
        ],
    volunteering: [{ label: isAuthenticated ? "Participar como voluntario" : "Ver oportunidades", to: "/voluntariado" }],
    entrepreneurship: [{ label: "Ver emprendimientos", to: "/ventures" }],
    donations: [{ label: "Donar", to: "/donaciones" }],
  } as const;
  const serviceDetails = {
    affiliation: {
      icon: publicCategories.affiliation.icon,
      tone: "affiliates" as const,
      image: "/images/public/home/community-curime-wide.webp",
      alt: "Encuentro comunitario en Curime.",
      steps: ["Complete sus datos", "Envíe la solicitud", "Espere revisión"],
    },
    reservations: {
      icon: publicCategories.reservations.icon,
      tone: "reservations" as const,
      image: "/images/public/home/hero-curime-wide.webp",
      alt: "Paisaje rural de Curime.",
      steps: ["Elija espacio y horario", "Consulte disponibilidad", "Revise y envíe"],
    },
    volunteering: {
      icon: publicCategories.volunteering.icon,
      tone: "volunteering" as const,
      image: "/images/public/home/community-curime-fallback.jpg",
      alt: "Actividad de la comunidad en Curime.",
      steps: ["Vea oportunidades", "Elija una actividad", "Envíe su postulación"],
    },
    entrepreneurship: {
      icon: publicCategories.entrepreneurship.icon,
      tone: "entrepreneurship" as const,
      image: "/images/public/home/community-curime-wide.webp",
      alt: "Espacio de encuentro comunitario en Curime.",
      steps: ["Abra el directorio", "Busque una iniciativa", "Consulte detalles"],
    },
    donations: {
      icon: publicCategories.donations.icon,
      tone: "donations" as const,
      image: "/images/public/home/hero-curime-wide.webp",
      alt: "Paisaje de Curime.",
      steps: ["Describa su aporte", "Envíe la solicitud", "Espere coordinación"],
    },
  } satisfies Record<(typeof services)[number]["key"], {
    icon: CategoryIconGlyph;
    tone: "affiliates" | "reservations" | "volunteering" | "entrepreneurship" | "donations";
    image: string;
    alt: string;
    steps: string[];
  }>;

  return (
    <>
      <Seo title="Servicios" description="Servicios digitales de ADI Curime." />
      <section aria-labelledby="services-title" className="border-b border-border/70 bg-surface-muted">
        <div className="public-container">
          <Breadcrumbs current="Servicios" variant="hero" />
          <div className="grid overflow-hidden rounded-surface border border-border/70 bg-surface-page md:grid-cols-[1.02fr_0.98fr] md:items-stretch">
            <div className="flex flex-col justify-center px-5 py-10 sm:px-8 md:py-11 lg:min-h-72 lg:px-12">
              <p className="public-eyebrow text-brand-primary">Gestiones comunitarias</p>
              <h1 id="services-title" className="public-heading mt-3 text-heading-1 text-text-primary">Servicios para la comunidad</h1>
              <p className="mt-4 max-w-[38ch] text-pretty text-body-large leading-relaxed text-foreground-muted">Elija qué necesita hacer. Las solicitudes se revisan; no implican aprobación automática.</p>
              <a href="#servicios-disponibles" className="mt-6 inline-flex min-h-11 w-fit items-center justify-center rounded-control bg-brand-deep px-5 font-semibold text-white transition-colors duration-200 motion-reduce:transition-none hover:bg-brand-primary focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">Explorar servicios</a>
            </div>
            <picture className="block aspect-[16/10] overflow-hidden bg-surface-muted md:aspect-[16/10] lg:min-h-full lg:aspect-auto">
              <source media="(max-width: 767px)" srcSet="/images/public/home/hero-curime-mobile.webp" />
              <source srcSet="/images/public/home/hero-curime-wide.webp" />
              <img src="/images/public/home/hero-curime-fallback.jpg" alt="Paisaje rural de Curime, Guanacaste." width="1600" height="1200" className="size-full object-cover object-[58%_59%]" />
            </picture>
          </div>
        </div>
      </section>
      <section aria-labelledby="service-process-title" className="public-section border-b border-border/70 bg-surface-muted">
        <div className="public-container">
          <div className="grid gap-8 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
            <header><p className="public-eyebrow text-brand-primary">Antes de enviar</p><h2 id="service-process-title" className="public-heading mt-3 text-text-primary">Cómo funciona una solicitud</h2><p className="mt-4 max-w-md text-body leading-relaxed text-foreground-muted">Cada gestión tiene requisitos propios. Enviar información o consultar disponibilidad no equivale a una aprobación de la Asociación.</p></header>
            <ol className="grid gap-5 sm:grid-cols-3">{['Seleccione una gestión', 'Complete o consulte la información', 'Revise y confirme cuando corresponda'].map((step, index) => <li key={step} className="border-t-2 border-brand-accent pt-4"><span className="grid size-7 place-items-center rounded-full bg-brand-accent/35 text-caption font-bold text-brand-deep">{index + 1}</span><p className="mt-3 font-heading text-heading-3 text-text-primary">{step}</p></li>)}</ol>
          </div>
        </div>
      </section>
      <section id="servicios-disponibles" aria-labelledby="available-services-title" className="public-section border-b border-border/70 bg-surface-card">
        <div className="public-container">
          <header className="mb-7 max-w-3xl md:mb-9">
            <p className="public-eyebrow text-brand-primary">Servicios disponibles</p>
            <h2 id="available-services-title" className="public-heading mt-3 text-text-primary">Gestiones que puede iniciar en línea</h2>
            <p className="mt-4 text-body leading-relaxed text-foreground-muted">Cada servicio indica cómo comenzar y qué ocurre después de enviar una solicitud o consultar información.</p>
          </header>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((item) => {
              const detail = serviceDetails[item.key];
              const Icon = detail.icon;
              const enabled = moduleAvailability[item.key].enabled;
              return <article key={item.key} className="flex h-full min-w-0 flex-col rounded-surface border border-border/70 bg-surface-card p-5 shadow-sm transition-[border-color,box-shadow] duration-200 motion-reduce:transition-none hover:border-brand-primary hover:shadow-md focus-within:border-brand-primary focus-within:shadow-md md:p-6">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <CategoryIcon icon={Icon} tone={detail.tone} />
                  <span className={`inline-flex min-h-8 items-center rounded-control px-3 text-caption font-bold uppercase tracking-[0.1em] ${enabled ? "bg-success-bg text-success" : "bg-surface-muted text-foreground-muted"}`}>{enabled ? "Disponible" : "Próximamente"}</span>
                </div>
                <h3 className="mt-5 min-w-0 font-heading text-heading-3 text-text-primary">{item.title}</h3>
                <div className="flex flex-1 flex-col">
                  <p className="mt-3 min-w-0 flex-1 text-pretty text-body-small leading-relaxed text-foreground-muted">{item.text}</p>
                  <ol className="mt-5 grid gap-2 border-t border-border/60 pt-4 text-body-small xl:grid-cols-3">
                    {detail.steps?.map((step, index) => <li key={step} className="flex min-w-0 items-center gap-2 text-body-small leading-snug text-foreground-secondary xl:flex-col xl:items-center xl:text-center"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-accent/35 font-bold text-brand-deep">{index + 1}</span><span className="min-w-0 break-words">{step}</span></li>)}
                  </ol>
                  {enabled ? <div className="mt-6 flex flex-wrap gap-3">
                    {serviceActions[item.key].map((action, index) => <Link key={`${action.to}-${action.label}`} to={action.to} className={`inline-flex min-h-11 items-center justify-center rounded-control px-4 py-2 text-body-small font-semibold transition-[background-color,border-color,color,box-shadow] duration-200 motion-reduce:transition-none hover:shadow-sm focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring ${index === 0 ? "bg-brand-deep text-white hover:bg-brand-primary" : "border border-brand-deep text-brand-deep hover:bg-brand-deep/10"}`}>{action.label}</Link>)}
                  </div> : <p className="mt-6 text-body-small font-semibold text-foreground-muted">Disponible próximamente</p>}
                </div>
              </article>;
            })}
          </div>
        </div>
      </section>
      <section aria-labelledby="services-help-title" className="public-section bg-brand-deep text-white">
        <div className="public-container grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="max-w-3xl"><p className="public-eyebrow text-brand-accent">Orientación institucional</p><h2 id="services-help-title" className="mt-3 font-heading text-heading-2 font-normal">¿Necesita orientación?</h2><p className="mt-4 text-body leading-relaxed text-white/80">Utilice los canales oficiales de contacto para consultar una gestión. Si necesita solicitar una reserva, cree una cuenta o inicie sesión para continuar.</p></div>
          <div className="flex flex-wrap gap-3 lg:justify-end"><Link to="/contacto" className="inline-flex min-h-11 items-center justify-center rounded-control bg-surface-page px-5 py-2 font-bold text-brand-deep transition-colors duration-200 motion-reduce:transition-none hover:bg-white hover:shadow-sm focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-accent">Contactar a la Asociación</Link>{!isAuthenticated && <><Link to="/register" className="inline-flex min-h-11 items-center justify-center rounded-control border border-white/40 px-5 py-2 font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-accent">Crear una cuenta</Link><Link to="/login" className="inline-flex min-h-11 items-center justify-center rounded-control border border-white/40 px-5 py-2 font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-accent">Iniciar sesión</Link></>}</div>
        </div>
      </section>
    </>
  );
}
export function TransparencyPage() {
  const categoryIcons: Record<string, LucideIcon> = {
    "Documentos públicos": FileText,
    Informes: BarChart3,
    Proyectos: FolderOpen,
    "Rendición de cuentas": ClipboardList,
    "Reportes administrativos": FileText,
    "Reportes financieros autorizados": BarChart3,
    "Información relacionada con DINADECO": Landmark,
  };
  const categoryDescriptions: Record<string, string> = {
    "Documentos públicos": "Información institucional para consulta de la comunidad.",
    Informes: "Informes de gestión y resultados de la Asociación.",
    Proyectos: "Información sobre los proyectos de la comunidad.",
    "Rendición de cuentas": "Información sobre el cumplimiento de los compromisos de la Asociación.",
    "Reportes administrativos": "Documentos relacionados con la gestión administrativa.",
    "Reportes financieros autorizados": "Reportes económicos autorizados por la Asociación.",
    "Información relacionada con DINADECO": "Documentación vinculada con la Dirección Nacional de Desarrollo de la Comunidad.",
  };
  return (
    <>
      <Seo title="Transparencia" description="Información pública y transparencia de ADI Curime." />
      <header className="border-b border-border/70 bg-surface-muted">
        <div className="public-container">
          <Breadcrumbs current="Transparencia" variant="hero" />
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.9fr)] lg:items-center lg:gap-12">
            <div className="min-w-0 lg:py-6">
              <p className="public-eyebrow text-brand-primary">ADI Curime · Información pública</p>
              <h1 className="public-heading mt-2 max-w-3xl text-heading-1 text-text-primary md:mt-3">Transparencia</h1>
              <p className="mt-3 max-w-2xl text-pretty text-body-large leading-relaxed text-foreground-secondary md:mt-4">Un espacio preparado para publicar información institucional cuando cuente con autorización de la Asociación.</p>
            </div>
            <picture className="block aspect-[16/9] overflow-hidden rounded-surface border border-border/70 bg-surface-page shadow-surface lg:min-h-72">
              <source media="(max-width: 767px)" srcSet="/images/public/home/hero-curime-mobile.webp" type="image/webp" />
              <source srcSet="/images/public/home/hero-curime-wide.webp" type="image/webp" />
              <img src="/images/public/home/hero-curime-fallback.jpg" alt="Paisaje rural de Curime, Guanacaste." width="1600" height="1200" className="size-full object-cover object-[58%_59%]" />
            </picture>
          </div>
        </div>
      </header>
      <SectionContainer className="space-y-10 md:space-y-16">
        <section aria-labelledby="transparency-areas" className="space-y-6">
          <div className="max-w-3xl"><p className="public-eyebrow text-brand-primary">Consulta pública</p><h2 id="transparency-areas" className="public-heading mt-3 text-text-primary">Áreas previstas de información</h2><p className="mt-4 text-pretty text-body leading-relaxed text-foreground-muted">Estas áreas orientan la publicación futura. No representan documentos, informes ni datos disponibles actualmente.</p></div>
          <div className="grid grid-cols-1 min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {transparencyGroups.map((group) => <article key={group.title} aria-labelledby={`transparency-${group.title.replaceAll(' ', '-').toLowerCase()}`} className="min-w-0 rounded-surface border border-border/70 bg-surface-card p-5 shadow-sm md:p-6"><h3 id={`transparency-${group.title.replaceAll(' ', '-').toLowerCase()}`} className="font-heading text-heading-3 text-text-primary">{group.title}</h3><ul className="mt-4 divide-y divide-border/70 border-t border-border/70">{group.items.map((title) => { const Icon = categoryIcons[title]; return <li key={title} className="flex min-w-0 items-start gap-3 py-4 last:pb-0"><CategoryIcon icon={Icon} tone="transparency" size="sm" /><div className="min-w-0"><h4 className="break-words font-semibold text-text-primary">{title}</h4><p className="mt-1 text-body-small leading-relaxed text-foreground-muted">{categoryDescriptions[title]}</p><p className="mt-2 text-caption font-bold uppercase tracking-[0.12em] text-brand-primary">En preparación</p></div></li> })}</ul></article>)}
          </div>
        </section>
        <section aria-labelledby="transparency-status" className="space-y-3">
          <p id="transparency-status" className="public-eyebrow text-brand-primary">Estado de publicación</p>
          <EmptyContentState title="No hay documentos publicados por el momento" text="La información se publica únicamente cuando cuenta con autorización institucional. Cuando existan documentos disponibles, se mostrarán aquí con su información de consulta." />
          <Link to="/contacto" className="inline-flex min-h-11 items-center font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">Consultar información específica</Link>
        </section>
      </SectionContainer>
    </>
  );
}
export function ContactPage() {
  const channels: ReadonlyArray<{
    name: string;
    detail: string;
    action: string;
    ariaLabel: string;
    href: string;
    icon: CategoryIconGlyph;
    external?: boolean;
  }> = [
    {
      name: "Instagram",
      detail: site.socialLinks.instagram.label,
      action: "Visitar Instagram",
      ariaLabel: "Abrir Instagram de ADI Curime",
      href: site.socialLinks.instagram.url,
      icon: InstagramChannelIcon,
      external: true,
    },
    {
      name: "Facebook",
      detail: site.socialLinks.facebook.label,
      action: "Visitar Facebook",
      ariaLabel: "Abrir Facebook de ADI Curime",
      href: site.socialLinks.facebook.url,
      icon: FacebookChannelIcon,
      external: true,
    },
    {
      name: "Correo electrónico",
      detail: site.email,
      action: "Enviar correo",
      ariaLabel: "Enviar correo a ADI Curime",
      href: `mailto:${site.email}`,
      icon: Mail,
    },
  ];
  return (
    <>
      <Seo title="Contacto" description="Canales de contacto de ADI Curime." />
      <PublicPageHeader
        title="Contacto"
        intro="Hable con la Asociación a través de sus medios oficiales."
        eyebrow="Canales institucionales"
        breadcrumb="Contacto"
      />
      <SectionContainer className="space-y-8 md:space-y-12" spacing="spacious">
        <section aria-labelledby="contact-channels-title">
          <div className="mb-6 max-w-3xl md:mb-8"><p className="public-eyebrow text-brand-primary">Canales disponibles</p><h2 id="contact-channels-title" className="public-heading mt-3 text-text-primary">Comuníquese con la Asociación</h2><p className="mt-4 text-pretty text-body leading-relaxed text-foreground-muted">Utilice los medios oficiales confirmados para realizar una consulta directamente con la Asociación.</p></div>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {channels.map(({ name, detail, action, ariaLabel, href, icon: Icon, external }) => (
              <article key={name} className="flex h-full min-w-0 flex-col rounded-surface border border-border/70 bg-surface-card p-5 shadow-sm transition-[border-color,box-shadow] duration-200 motion-reduce:transition-none hover:border-brand-primary hover:shadow-sm md:p-6">
                <CategoryIcon icon={Icon} tone="contact" />
                <h3 className="mt-4 min-w-0 font-heading text-heading-3 text-text-primary">{name}</h3>
                <p className="mt-2 min-w-0 [overflow-wrap:anywhere] text-body-small leading-relaxed text-foreground-muted">{detail}</p>
                <a className="mt-auto inline-flex min-h-11 w-fit max-w-full items-center break-words pt-4 font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring" href={href} aria-label={ariaLabel} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{action}</a>
              </article>
            ))}
          </div>
        </section>
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.2fr)] lg:items-start">
          <div className="min-w-0 space-y-5">
            <section aria-labelledby="contact-location-title" className="min-w-0 rounded-surface border border-border/70 bg-surface-card p-5 shadow-sm md:p-6">
              <span aria-hidden="true" className="grid size-11 place-items-center rounded-control bg-brand-accent/20 text-brand-deep"><MapPin className="size-5" /></span>
              <h2 id="contact-location-title" className="mt-4 font-heading text-heading-3 text-text-primary">Ubicación</h2>
              <p className="mt-2 min-w-0 break-words text-body leading-relaxed text-foreground-muted">{site.location}</p>
            </section>
            <aside aria-labelledby="contact-notice" className="grid min-w-0 gap-4 border-l-4 border-brand-accent bg-surface-page px-5 py-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start md:px-6">
              <span aria-hidden="true" className="grid size-11 place-items-center rounded-control bg-brand-accent/25 text-brand-deep"><Landmark className="size-5" /></span>
              <div className="min-w-0"><p className="public-eyebrow text-brand-primary">Transparencia de envío</p><h2 id="contact-notice" className="mt-2 font-heading text-heading-3 text-text-primary">Contacto por canales oficiales</h2><p className="mt-2 text-pretty text-body-small leading-relaxed text-foreground-muted">Para comunicarse con la Asociación, use el correo o las redes oficiales mostradas arriba. El formulario solo prepara su mensaje.</p></div>
            </aside>
          </div>
          <section aria-label="Preparar una consulta" className="min-w-0 rounded-surface border border-border/70 bg-surface-muted p-5 md:p-8 lg:p-9">
            <ContactForm />
          </section>
        </div>
      </SectionContainer>
    </>
  );
}
