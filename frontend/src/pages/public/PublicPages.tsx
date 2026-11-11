import { Link, Navigate, useParams } from "react-router-dom";
import { BarChart3, Building2, CalendarDays, Camera, ClipboardList, Eye, FileText, FolderOpen, HandHeart, HeartHandshake, Landmark, Mail, Newspaper, Store, Target, UsersRound, type LucideIcon } from "lucide-react";
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

const transparencyGroups = [
  { title: 'Información pública', items: ['Documentos públicos', 'Informes', 'Proyectos'] },
  { title: 'Rendición de cuentas', items: ['Rendición de cuentas', 'Reportes administrativos', 'Reportes financieros autorizados'] },
  { title: 'Marco institucional', items: ['Información relacionada con DINADECO'] },
] as const;
export function AboutPage() {
  const identityCards = [
    { title: "Misión", icon: Target, description: "Promover el desarrollo integral de la comunidad de Curime mediante proyectos y servicios que generen bienestar y oportunidades para todas las personas." },
    { title: "Visión", icon: Building2, description: "Ser una Asociación reconocida por su liderazgo, transparencia y capacidad de gestión, contribuyendo al desarrollo sostenible de Curime y sus alrededores." },
    { title: "Objetivos", icon: HandHeart, description: "Impulsar el desarrollo social, económico y cultural, fortalecer la participación comunal y administrar los recursos con eficiencia y transparencia." },
  ] as const;
  return (
    <>
      <Seo title="Nosotros" description="Conozca el espacio institucional de ADI Curime." />
      <section className="public-container" aria-labelledby="about-title">
        <Breadcrumbs current="Nosotros" variant="hero" />
        <div className="relative isolate overflow-hidden rounded-surface bg-brand-ivory">
          <picture className="absolute inset-0">
            <source media="(max-width: 767px)" srcSet="/images/public/home/hero-curime-mobile.webp" type="image/webp" />
            <source srcSet="/images/public/home/hero-curime-wide.webp" type="image/webp" />
            <img src="/images/public/home/hero-curime-fallback.jpg" alt="Paisaje rural de Curime, Guanacaste." width="1600" height="1200" className="size-full object-cover object-[58%_59%]" />
          </picture>
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-brand-ivory via-brand-ivory/90 to-brand-ivory/40 lg:bg-gradient-to-r" />
          <div className="relative flex min-h-[22rem] items-center px-5 py-12 md:min-h-[25rem] md:px-10 lg:min-h-[28rem] lg:px-12 xl:min-h-[30rem]">
            <div className="max-w-xl lg:max-w-[35rem]">
              <p className="public-eyebrow text-brand-primary">ADI Curime · Nicoya · Guanacaste</p>
              <h1 id="about-title" className="public-heading mt-4 text-display text-brand-ink">Conozca nuestra <span className="block">Asociación</span></h1>
              <p className="mt-5 text-body-large leading-relaxed text-foreground-muted">Trabajamos por el desarrollo integral de nuestra comunidad, con transparencia y compromiso.</p>
              <div aria-hidden="true" className="mt-6 h-1 w-16 bg-brand-accent" />
            </div>
          </div>
        </div>
      </section>
      <SectionContainer className="space-y-10 md:space-y-16">
        <section aria-labelledby="about-intro" className="grid gap-7 border-b border-brand-sage/70 pb-10 lg:grid-cols-[minmax(14rem,4fr)_minmax(0,6fr)] lg:gap-12 lg:pb-14">
          <div><p className="public-eyebrow text-brand-primary">La Asociación</p><h2 id="about-intro" className="public-heading mt-3 text-brand-ink">Quiénes somos</h2></div>
          <div className="max-w-3xl space-y-4 text-pretty text-body-large leading-relaxed text-foreground-muted"><p>La Asociación de Desarrollo Integral de Curime cuenta con este espacio para presentar su identidad, historia y organización a la comunidad.</p><p>Personas unidas por un propósito común.</p><p>Los datos institucionales específicos se publicarán cuando hayan sido revisados y autorizados por la Asociación.</p></div>
        </section>
        <section aria-labelledby="identity-title">
          <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(14rem,4fr)_minmax(0,6fr)] lg:items-end lg:gap-12"><div><p className="public-eyebrow text-brand-primary">Nuestra orientación</p><h2 id="identity-title" className="public-heading mt-3 text-brand-ink">Misión, visión y objetivos</h2></div><p className="max-w-2xl text-pretty text-body leading-relaxed text-foreground-muted">Textos propuestos, pendientes de validación institucional.</p></div>
          <div className="grid divide-y divide-brand-sage/70 border-y border-brand-sage/70 md:grid-cols-3 md:divide-x md:divide-y-0">{identityCards.map(({ title, icon: Icon, description }) => <article key={title} className="py-6 md:px-6 md:first:pl-0 md:last:pr-0"><span className="grid size-12 place-items-center rounded-control bg-brand-accent/20 text-brand-deep"><Icon className="size-5" aria-hidden="true" /></span><h3 className="mt-5 font-heading text-heading-3 text-brand-ink">{title}</h3><p className="mt-3 text-body-small leading-relaxed text-foreground-muted">{description}</p></article>)}</div>
        </section>
        <section aria-labelledby="notice-title" className="rounded-surface border border-brand-sage/70 bg-surface-muted p-6 md:p-8">
          <div className="mb-7"><p className="public-eyebrow text-brand-primary">Información pendiente</p><h2 id="notice-title" className="public-heading mt-3 text-brand-ink">Historia y Junta Directiva</h2><p className="mt-3 max-w-2xl text-pretty text-body leading-relaxed text-foreground-muted">Publicar solo información institucional validada.</p></div>
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
            <article className="border-t border-brand-sage/70 pt-5"><div className="flex items-start gap-4"><span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-accent/25 text-brand-deep"><CalendarDays className="size-6" /></span><div><h3 id="history-title" className="font-heading text-heading-3 text-brand-ink">Nuestra historia</h3><p className="mt-3 text-body leading-relaxed text-foreground-muted">La historia institucional se publicará cuando las fechas y acontecimientos hayan sido revisados con la ADI. Por ahora, no se presentan hitos ni cronologías sin validación.</p></div></div></article>
            <article className="border-t border-brand-sage/70 pt-5"><div className="flex items-start gap-4"><span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-deep text-brand-ivory"><UsersRound className="size-6" /></span><div><h3 id="governance-title" className="font-heading text-heading-3 text-brand-ink">Junta Directiva</h3><p className="mt-3 text-body leading-relaxed text-foreground-muted">Integrantes, cargos y período pendientes de validación con la ADI. No se publica una nómina sin confirmación institucional.</p></div></div></article>
          </div>
        </section>
        <section aria-labelledby="about-participation" className="rounded-surface bg-brand-deep px-6 py-8 text-brand-ivory md:px-10 md:py-10"><p className="public-eyebrow text-brand-accent">Formar parte</p><div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-10"><div><h2 id="about-participation" className="font-heading text-heading-2 font-normal text-brand-ivory">Conozca las formas de participación</h2><p className="mt-3 max-w-2xl text-body leading-relaxed text-brand-ivory/80">Explore oportunidades, actividades y canales oficiales de la Asociación sin asumir funciones, cargos o procesos aún no publicados.</p></div><Link to="/comunidad" className="inline-flex min-h-11 items-center justify-center rounded-control bg-brand-accent px-5 font-semibold text-brand-deep transition-colors hover:bg-brand-soft focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-accent">Ir a comunidad</Link></div></section>
      </SectionContainer>
    </>
  );
}
export function CommunityPage() {
  const communityActions = [
    { title: 'Eventos', description: 'Consulte las actividades comunicadas oficialmente por la Asociación.', icon: CalendarDays, to: '/eventos', label: 'Ver eventos' },
    { title: 'Voluntariado', description: 'Explore oportunidades de participación publicadas.', icon: HandHeart, to: '/voluntariado', label: 'Ver oportunidades de voluntariado' },
    { title: 'Emprendimientos', description: 'Conozca los emprendimientos locales publicados.', icon: Store, to: '/ventures', label: 'Ver emprendimientos' },
    { title: 'Contacto', description: 'Use los canales oficiales para consultar a la Asociación.', icon: Mail, to: '/contacto', label: 'Contactar a la ADI' },
  ] as const;

  return (
    <>
      <Seo title="Comunidad" description="Espacio comunitario de Curime." />
      <section aria-labelledby="community-title" className="border-b border-brand-sage/70 bg-brand-ivory">
        <div className="public-container">
          <Breadcrumbs current="Comunidad" variant="hero" />
          <div className="grid gap-7 pb-8 md:gap-10 md:pb-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(20rem,1.2fr)] lg:items-center lg:gap-12">
            <div className="lg:py-8">
              <p className="public-eyebrow text-brand-primary">Vida comunitaria</p>
              <h1 id="community-title" className="public-heading mt-4 max-w-xl text-display text-brand-ink">Un espacio para encontrarnos</h1>
              <p className="mt-5 max-w-xl text-pretty text-body-large leading-relaxed text-foreground-muted">Conozca los espacios, actividades e iniciativas que fortalecen la participación y el encuentro en Curime.</p>
              <Link to="/contacto" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-control bg-primary px-6 py-3 font-bold text-primary-foreground transition-colors hover:bg-interaction-primary-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">Contáctenos</Link>
            </div>
            <figure className="aspect-[16/10] overflow-hidden rounded-surface border border-brand-sage/70 bg-surface-muted shadow-surface lg:min-h-80">
              <picture className="block size-full"><source media="(max-width: 767px)" srcSet="/images/public/home/community-curime-mobile.webp" type="image/webp" /><source srcSet="/images/public/home/community-curime-wide.webp" type="image/webp" /><img src="/images/public/home/community-curime-fallback.jpg" alt="Actividad comunitaria en la cancha de la comunidad." width="1500" height="1000" className="size-full object-cover object-[50%_42%]" /></picture>
            </figure>
          </div>
        </div>
      </section>
      <SectionContainer className="space-y-10 md:space-y-16">
        <section aria-labelledby="community-actions">
          <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(14rem,4fr)_minmax(0,6fr)] lg:items-end lg:gap-12"><div><p className="public-eyebrow text-brand-primary">Explore la comunidad</p><h2 id="community-actions" className="public-heading mt-3 text-brand-ink">Formas de participar</h2></div><p className="max-w-2xl text-pretty text-body leading-relaxed text-foreground-muted">Acceda a actividades, oportunidades y canales comunitarios ya disponibles en el portal.</p></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{communityActions.map(({ title, description, icon: Icon, to, label }) => <article key={title} className="flex min-h-full flex-col rounded-surface border border-brand-sage/70 bg-card-white p-5 shadow-sm"><span className="grid size-12 place-items-center rounded-control bg-brand-accent/20 text-brand-deep"><Icon className="size-5" aria-hidden="true" /></span><h3 className="mt-5 font-heading text-heading-3 text-brand-ink">{title}</h3><p className="mt-2 text-body-small leading-relaxed text-foreground-muted">{description}</p><Link to={to} className="mt-5 inline-flex min-h-11 items-center font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">{label}</Link></article>)}</div>
        </section>
        <section aria-labelledby="community-areas" className="grid gap-7 border-y border-brand-sage/70 py-8 md:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.85fr)] lg:items-center lg:gap-12"><div><p className="public-eyebrow text-brand-primary">Vida comunitaria</p><h2 id="community-areas" className="public-heading mt-3 text-brand-ink">Iniciativas y proyectos</h2><p className="mt-4 max-w-2xl text-pretty text-body leading-relaxed text-foreground-muted">Una comunidad que crece en conjunto. Este espacio reúne información sobre iniciativas, proyectos y actividades comunitarias de Curime. Algunos contenidos se encuentran en preparación.</p></div><figure className="aspect-[3/2] overflow-hidden rounded-surface border border-brand-sage/70 bg-surface-muted shadow-surface"><img src="/images/public/home/community-curime-fallback.jpg" alt="Espacio de encuentro comunitario en Curime." width="1500" height="1000" loading="lazy" className="size-full object-cover" /></figure></section>
        <section aria-labelledby="community-notice" className="grid gap-6 rounded-surface bg-brand-deep p-6 text-brand-ivory md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-9"><div><p className="public-eyebrow text-brand-accent">Información verificada</p><h2 id="community-notice" className="mt-3 font-heading text-heading-2 text-brand-ivory">Proyectos y galerías se publican cuando están autorizados</h2><p className="mt-3 max-w-2xl text-body leading-relaxed text-brand-ivory/80">Si desea consultar una iniciativa, actividad o proyecto, use los canales oficiales de la Asociación.</p></div><Link to="/contacto" className="inline-flex min-h-11 items-center justify-center rounded-control bg-brand-ivory px-5 font-semibold text-brand-deep transition-colors hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-brand-accent">Contactar a la ADI</Link></section>
      </SectionContainer>
    </>
  );
}
export function NewsPage() {
  const verifiedNews = publicContentService.listNews().filter((item) => item.date !== 'Próximamente');
  return (
    <>
      <Seo title="Noticias" description="Noticias y comunicados verificados de ADI Curime." />
      <header className="border-b border-brand-sage/70 bg-surface-muted">
        <div className="public-container">
          <Breadcrumbs current="Noticias" variant="simple" />
          <div className="grid gap-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="max-w-2xl">
            <p className="public-eyebrow text-brand-primary">ADI Curime · Actualidad</p>
            <h1 className="public-heading mt-4 text-display text-brand-ink">Noticias</h1>
            <p className="mt-5 text-body-large leading-relaxed text-foreground-muted">Comunicados y novedades oficiales de la Asociación, publicados después de su verificación.</p>
            </div>
            <span aria-hidden="true" className="hidden size-28 place-items-center rounded-surface border border-brand-sage/70 bg-card-white text-brand-primary md:grid"><Newspaper className="size-12" strokeWidth={1.4} /></span>
          </div>
        </div>
      </header>
      <SectionContainer className="space-y-7">
        <div><p className="public-eyebrow text-brand-primary">Información verificada</p><h2 className="public-heading mt-3 text-brand-ink">Comunicados publicados</h2></div>
        {verifiedNews.length === 0 ? <div className="grid gap-6 rounded-surface bg-brand-ivory p-5 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:p-8"><span aria-hidden="true" className="grid size-14 place-items-center rounded-full bg-brand-accent/30 text-brand-deep"><Newspaper className="size-7" /></span><EmptyContentState title="No hay noticias verificadas publicadas" text="Los comunicados y noticias oficiales aparecerán aquí cuando la Asociación los autorice." /></div> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{verifiedNews.map((item) => <NewsCard key={item.slug} item={item} />)}</div>}
        <aside className="flex flex-col gap-4 border-t border-brand-sage/70 pt-7 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-2xl text-body-small leading-relaxed text-foreground-muted">La Asociación publica únicamente comunicados y novedades que hayan sido revisados como información oficial.</p><Link to="/contacto" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-control border border-brand-deep px-4 font-semibold text-brand-deep transition-colors hover:bg-brand-deep hover:text-brand-ivory focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring">Consultar canales oficiales</Link></aside>
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
        <h1 className="public-heading mt-4 text-brand-ink">{item.title}</h1>
        <p className="mt-5 text-body-large leading-relaxed text-foreground-muted">{item.excerpt}</p>
        <div className="mt-8 border-y border-brand-sage/70 py-7 text-body leading-relaxed text-foreground-secondary"><p>{item.body}</p></div>
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
    donations: [{ label: "Solicitar una donación", to: "/donaciones" }],
  } as const;
  const serviceDetails = {
    affiliation: {
      icon: UsersRound,
      image: "/images/public/home/community-curime-wide.webp",
      alt: "Encuentro comunitario en Curime.",
      description: "Inicie su solicitud de afiliación en línea y comparta los datos de identidad, contacto y residencia que la Asociación necesita para revisarla. Al enviarla, el equipo de ADI Curime recibirá la información y podrá darle seguimiento; el envío no significa que la afiliación quede aprobada automáticamente.",
      steps: ["Complete sus datos", "Envíe la solicitud", "Espere la revisión de la Asociación"],
    },
    reservations: {
      icon: CalendarDays,
      image: "/images/public/home/hero-curime-wide.webp",
      alt: "Paisaje rural de Curime.",
      description: "Solicite un espacio comunitario indicando el lugar, la fecha, el horario y el motivo de uso. Antes de continuar, puede consultar si el horario está disponible; luego revise los datos y envíe la solicitud para revisión. La consulta de disponibilidad no sustituye la confirmación de la reserva.",
      steps: ["Elija un espacio y horario", "Consulte disponibilidad", "Revise y envíe la solicitud"],
    },
    volunteering: {
      icon: HandHeart,
      image: "/images/public/home/community-curime-fallback.jpg",
      alt: "Actividad de la comunidad en Curime.",
      description: "Conozca las oportunidades de voluntariado publicadas por la Asociación y postúlese a las actividades que le interesen. Puede participar sin crear una cuenta; cada postulación queda pendiente de revisión.",
      steps: ["Vea las oportunidades", "Elija una actividad", "Envíe su postulación"],
    },
    entrepreneurship: {
      icon: Store,
      image: "/images/public/home/community-curime-wide.webp",
      alt: "Espacio de encuentro comunitario en Curime.",
      description: "Explore el directorio público de emprendimientos publicados y conozca las iniciativas de la comunidad. Puede buscar emprendimientos y consultar sus detalles sin iniciar sesión.",
      steps: ["Abra el directorio", "Busque una iniciativa", "Consulte sus detalles"],
    },
    donations: {
      icon: HeartHandshake,
      image: "/images/public/home/hero-curime-wide.webp",
      alt: "Paisaje de Curime.",
      description: "Comparta su intención de aportar dinero o bienes. La Asociación revisará la solicitud y coordinará con usted. El portal no procesa pagos ni confirma recepción.",
      steps: ["Describa su aporte", "Envíe la solicitud", "Espere la coordinación de la ADI"],
    },
  } satisfies Record<(typeof services)[number]["key"], {
    icon: LucideIcon;
    image: string;
    alt: string;
    description: string;
    steps: string[];
  }>;

  return (
    <>
      <Seo title="Servicios" description="Servicios digitales de ADI Curime." />
      <section aria-labelledby="services-title" className="relative isolate overflow-hidden bg-brand-ivory">
        <div className="public-container relative z-20"><Breadcrumbs current="Servicios" variant="hero" /></div>
        <picture className="relative mx-4 mt-8 block aspect-[16/10] overflow-hidden rounded-surface border border-brand-sage/70 shadow-surface lg:absolute lg:inset-y-0 lg:right-0 lg:mx-0 lg:mt-0 lg:h-full lg:w-[62%] lg:aspect-auto lg:rounded-none lg:border-0 lg:shadow-none">
          <source media="(max-width: 767px)" srcSet="/images/public/home/hero-curime-mobile.webp" />
          <source srcSet="/images/public/home/hero-curime-wide.webp" />
          <img src="/images/public/home/hero-curime-fallback.jpg" alt="Paisaje rural de Curime, Guanacaste." width="1600" height="1200" className="size-full object-cover object-[58%_59%]" />
        </picture>
        <div aria-hidden="true" className="absolute inset-y-0 left-[32%] z-10 hidden w-[30%] bg-gradient-to-r from-brand-ivory to-transparent lg:block" />
        <div className="public-container relative z-20 flex items-center py-12 md:py-16 lg:min-h-[34rem]">
          <div className="max-w-xl">
            <p className="public-eyebrow text-brand-primary">ADI Curime · Servicios a la comunidad</p>
            <h1 id="services-title" className="public-heading mt-4 text-display text-brand-ink">Servicios para la comunidad</h1>
            <p className="mt-5 max-w-[50ch] text-body-large leading-relaxed text-foreground-muted">Conozca las gestiones que puede iniciar en línea y las opciones que la Asociación está preparando para la comunidad.</p>
            <a href="#servicios-disponibles" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-control bg-brand-deep px-6 font-semibold text-brand-ivory transition-colors hover:bg-brand-primary focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">Explorar servicios</a>
          </div>
        </div>
      </section>
      <section id="servicios-disponibles" aria-labelledby="available-services-title" className="border-b border-brand-sage/70 bg-surface-muted py-12 md:py-16">
        <div className="public-container">
          <header className="mb-8 max-w-3xl md:mb-10">
            <p className="public-eyebrow text-brand-primary">Servicios disponibles</p>
            <h2 id="available-services-title" className="public-heading mt-3 text-heading-1 text-brand-ink">Gestiones que puede iniciar en línea</h2>
            <p className="mt-4 text-body leading-relaxed text-foreground-muted">Cada servicio indica cómo comenzar y qué ocurre después de enviar una solicitud o consultar información.</p>
          </header>
          <div className="grid gap-6 lg:grid-cols-2">
            {services.filter((item) => moduleAvailability[item.key].enabled).map((item) => {
              const detail = serviceDetails[item.key];
              const Icon = detail.icon;
              return <article key={item.key} className="flex flex-col overflow-hidden rounded-surface border border-border bg-card-white shadow-sm">
                <figure className="relative aspect-[16/9] overflow-hidden bg-surface-muted">
                  <img src={detail.image} alt={detail.alt} width="1500" height="1000" loading="lazy" className="size-full object-cover" />
                  <span className="absolute left-4 top-4 inline-flex min-h-9 items-center gap-2 rounded-control bg-brand-ivory/95 px-3 text-body-small font-semibold text-brand-deep shadow-sm"><Icon className="size-4" aria-hidden="true" />Disponible</span>
                </figure>
                <div className="flex flex-1 flex-col p-5 md:p-7">
                  <h3 className="font-heading text-heading-2 font-normal text-brand-ink">{item.title}</h3>
                  <p className="mt-3 flex-1 text-body leading-relaxed text-foreground-muted">{detail.description}</p>
                  <ol className="mt-6 grid gap-3 sm:grid-cols-3">
                    {detail.steps?.map((step, index) => <li key={step} className="flex items-start gap-2 text-body-small leading-relaxed text-foreground-secondary"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-accent/35 font-bold text-brand-deep">{index + 1}</span><span>{step}</span></li>)}
                  </ol>
                  <div className="mt-7 flex flex-wrap gap-3">
                    {serviceActions[item.key].map((action, index) => <Link key={`${action.to}-${action.label}`} to={action.to} className={`inline-flex min-h-11 items-center justify-center rounded-control px-4 py-2 text-body-small font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring ${index === 0 ? "bg-brand-deep text-brand-ivory hover:bg-brand-primary" : "border border-brand-deep text-brand-deep hover:bg-brand-deep/10"}`}>{action.label}</Link>)}
                  </div>
                </div>
              </article>;
            })}
          </div>
        </div>
      </section>
      <section aria-labelledby="service-process-title" className="bg-brand-ivory py-12 md:py-16">
        <div className="public-container">
          <div className="grid gap-7 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
            <header><p className="public-eyebrow text-brand-primary">Antes de enviar</p><h2 id="service-process-title" className="public-heading mt-3 text-brand-ink">Cómo funciona una solicitud</h2><p className="mt-4 max-w-md text-body leading-relaxed text-foreground-muted">Cada gestión tiene requisitos propios. Enviar información o consultar disponibilidad no equivale a una aprobación de la Asociación.</p></header>
            <ol className="grid gap-4 sm:grid-cols-3">{['Seleccione una gestión', 'Complete o consulte la información', 'Revise y confirme cuando corresponda'].map((step, index) => <li key={step} className="border-t-2 border-brand-accent pt-4"><span className="text-caption font-bold tracking-[0.14em] text-brand-primary">0{index + 1}</span><p className="mt-3 font-heading text-heading-3 text-brand-ink">{step}</p></li>)}</ol>
          </div>
        </div>
      </section>
      <section aria-labelledby="upcoming-services-title" className="public-container py-12 md:py-16">
        <header className="mb-8 max-w-3xl md:mb-10">
          <p className="public-eyebrow text-brand-primary">Próximamente</p>
          <h2 id="upcoming-services-title" className="public-heading mt-3 text-heading-1 text-brand-ink">Más formas de participar</h2>
          <p className="mt-4 text-body leading-relaxed text-foreground-muted">Estas opciones se habilitarán cuando la Asociación confirme sus condiciones y canales.</p>
        </header>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.filter((item) => !moduleAvailability[item.key].enabled).map((item) => {
            const detail = serviceDetails[item.key];
            const Icon = detail.icon;
            return <article key={item.key} className="overflow-hidden rounded-surface border border-border bg-card-white shadow-sm">
              <figure className="aspect-[16/10] overflow-hidden bg-surface-muted"><img src={detail.image} alt={detail.alt} width="1500" height="1000" loading="lazy" className="size-full object-cover" /></figure>
              <div className="p-5"><span className="inline-flex min-h-9 items-center gap-2 rounded-control bg-brand-accent/25 px-3 text-body-small font-semibold text-brand-deep"><Icon className="size-4" aria-hidden="true" />Próximamente</span><h3 className="mt-4 font-heading text-heading-3 font-normal text-brand-ink">{item.title}</h3><p className="mt-2 text-body-small leading-relaxed text-foreground-muted">{detail.description}</p></div>
            </article>;
          })}
        </div>
      </section>
      {!isAuthenticated && moduleAvailability.userRegistration.enabled && <section aria-labelledby="account-title" className="border-t border-brand-sage/70 bg-surface-muted py-12 md:py-16">
        <div className="public-container grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="max-w-3xl"><p className="public-eyebrow text-brand-primary">Acceso al portal</p><h2 id="account-title" className="public-heading mt-3 text-heading-1 text-brand-ink">Crear una cuenta</h2><p className="mt-4 text-body leading-relaxed text-foreground-muted">Cree una cuenta comunitaria y verifique su correo para acceder a las gestiones que requieren sesión, como solicitar una reserva. Si ya tiene una cuenta, puede iniciar sesión.</p></div>
          <div className="flex flex-wrap gap-3 lg:justify-end"><Link to="/register" className="inline-flex min-h-11 items-center justify-center rounded-control bg-brand-deep px-5 py-2 font-semibold text-brand-ivory transition-colors hover:bg-brand-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring">Crear una cuenta</Link><Link to="/login" className="inline-flex min-h-11 items-center justify-center rounded-control border border-brand-deep px-5 py-2 font-semibold text-brand-deep transition-colors hover:bg-brand-deep/10 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring">Iniciar sesión</Link></div>
        </div>
      </section>}
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
      <header className="border-b border-brand-sage/70 bg-surface-muted">
        <div className="public-container">
          <Breadcrumbs current="Transparencia" variant="hero" />
          <div className="grid gap-8 lg:min-h-[24rem] lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:items-center lg:gap-14">
            <div>
            <p className="public-eyebrow text-brand-primary">ADI Curime · Información pública</p>
            <h1 className="public-heading mt-4 text-display text-brand-ink">Transparencia</h1>
            <p className="mt-5 max-w-xl text-body-large leading-relaxed text-foreground-muted">Un espacio preparado para publicar información institucional cuando cuente con autorización de la Asociación.</p>
            </div>
            <picture className="block overflow-hidden rounded-surface bg-surface-muted shadow-surface">
            <source media="(max-width: 767px)" srcSet="/images/public/home/hero-curime-mobile.webp" type="image/webp" />
            <source srcSet="/images/public/home/hero-curime-wide.webp" type="image/webp" />
            <img src="/images/public/home/hero-curime-fallback.jpg" alt="Paisaje rural de Curime, Guanacaste." width="1600" height="1200" className="aspect-[16/10] w-full object-cover" />
            </picture>
          </div>
        </div>
      </header>
      <SectionContainer className="space-y-10 md:space-y-16">
        <section aria-labelledby="transparency-status" className="grid gap-5 border-y border-brand-sage/70 py-7 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-6"><span aria-hidden="true" className="grid size-12 place-items-center rounded-control bg-brand-accent/25 text-brand-deep"><Eye className="size-6" /></span><div><p className="public-eyebrow text-brand-primary">Estado de publicación</p><h2 id="transparency-status" className="mt-2 font-heading text-heading-2 text-brand-ink">No hay documentos publicados por el momento</h2><p className="mt-2 max-w-3xl text-pretty text-body leading-relaxed text-foreground-muted">La información se publica únicamente cuando cuenta con autorización institucional. Cuando existan documentos disponibles, se mostrarán aquí con su información de consulta.</p></div></section>
        <section aria-labelledby="transparency-areas">
          <div className="mb-8 max-w-3xl"><p className="public-eyebrow text-brand-primary">Consulta pública</p><h2 id="transparency-areas" className="public-heading mt-3 text-brand-ink">Áreas previstas de información</h2><p className="mt-4 text-pretty text-body leading-relaxed text-foreground-muted">Estas áreas orientan la publicación futura. No representan documentos, informes ni datos disponibles actualmente.</p></div>
          <div className="grid gap-8 lg:grid-cols-3">
            {transparencyGroups.map((group) => <section key={group.title} aria-labelledby={`transparency-${group.title.replaceAll(' ', '-').toLowerCase()}`} className="border-t-2 border-brand-accent pt-5"><h3 id={`transparency-${group.title.replaceAll(' ', '-').toLowerCase()}`} className="font-heading text-heading-3 text-brand-ink">{group.title}</h3><ul className="mt-4 divide-y divide-brand-sage/70 border-y border-brand-sage/70">{group.items.map((title) => { const Icon = categoryIcons[title]; return <li key={title} className="flex gap-3 py-4"><span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-control bg-brand-accent/20 text-brand-deep"><Icon className="size-4" /></span><div><h4 className="font-semibold text-brand-ink">{title}</h4><p className="mt-1 text-body-small leading-relaxed text-foreground-muted">{categoryDescriptions[title]}</p><p className="mt-2 text-caption font-bold uppercase tracking-[0.12em] text-brand-primary">En preparación</p></div></li> })}</ul></section>)}
          </div>
        </section>
        <section aria-labelledby="transparency-contact" className="grid gap-5 border-t border-brand-sage/70 pt-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"><div><p className="public-eyebrow text-brand-primary">Consulta institucional</p><h2 id="transparency-contact" className="public-heading mt-3 text-brand-ink">¿Busca información específica?</h2><p className="mt-3 max-w-2xl text-body leading-relaxed text-foreground-muted">Use los canales oficiales para consultar por información que todavía no esté publicada en este portal.</p></div><Link to="/contacto" className="inline-flex min-h-11 items-center justify-center rounded-control bg-brand-deep px-5 font-semibold text-brand-ivory transition-colors hover:bg-brand-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring">Ir a contacto</Link></section>
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
    icon: LucideIcon;
    external?: boolean;
  }> = [
    {
      name: "Instagram",
      detail: site.socialLinks.instagram.label,
      action: "Visitar Instagram",
      ariaLabel: "Abrir Instagram de ADI Curime",
      href: site.socialLinks.instagram.url,
      icon: Camera,
      external: true,
    },
    {
      name: "Facebook",
      detail: site.socialLinks.facebook.label,
      action: "Visitar Facebook",
      ariaLabel: "Abrir Facebook de ADI Curime",
      href: site.socialLinks.facebook.url,
      icon: UsersRound,
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
        intro="Canales de contacto confirmados de la Asociación."
        breadcrumb="Contacto"
      />
      <SectionContainer>
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] lg:gap-12 xl:gap-16">
          <div className="min-w-0 lg:py-4">
            <p className="public-eyebrow text-brand-primary">Canales confirmados</p>
            <h2 className="public-heading mt-3 text-brand-ink">Contáctese con nosotros</h2>
            <p className="mt-4 max-w-xl text-pretty text-body-large leading-relaxed text-foreground-muted">Use estos canales oficiales para realizar una consulta directamente con la Asociación.</p>
            <div className="mt-8 divide-y divide-brand-sage/70 border-y border-brand-sage/70" aria-label="Canales oficiales de contacto">
              {channels.map(({ name, detail, action, ariaLabel, href, icon: Icon, external }) => (
                <article key={name} className="grid min-w-0 grid-cols-[auto_1fr] gap-4 py-5 first:pt-0 last:pb-0">
                  <div aria-hidden="true" className="grid size-11 place-items-center rounded-control bg-brand-soft/20 text-brand-deep">
                    <Icon className="size-5" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-brand-deep">{name}</h4>
                    <p className="mt-1 [overflow-wrap:anywhere] text-body-small text-foreground-muted">{detail}</p>
                    <a
                      className="mt-2 inline-flex min-h-11 items-center rounded-control font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring"
                      href={href}
                      aria-label={ariaLabel}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                    >
                      {action}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <ContactForm />
        </div>
        <aside className="mt-10 grid gap-5 border-t border-brand-sage/70 pt-7 md:grid-cols-[auto_minmax(0,1fr)] md:items-start"><span aria-hidden="true" className="grid size-12 place-items-center rounded-control bg-brand-accent/20 text-brand-deep"><Landmark className="size-6" /></span><div><p className="public-eyebrow text-brand-primary">Orientación</p><h2 className="mt-2 font-heading text-heading-2 text-brand-ink">Canales para la comunidad</h2><p className="mt-2 max-w-3xl text-body leading-relaxed text-foreground-muted">{site.location}. El formulario prepara su mensaje; para comunicarse con la Asociación use el correo o las redes oficiales mostradas arriba.</p></div></aside>
      </SectionContainer>
    </>
  );
}
