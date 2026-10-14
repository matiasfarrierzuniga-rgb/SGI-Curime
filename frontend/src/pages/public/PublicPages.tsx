import { Link, Navigate, useParams } from "react-router-dom";
import { Camera, Mail, UsersRound, type LucideIcon } from "lucide-react";
import { moduleAvailability, services, site } from "../../content/publicSiteContent";
import { publicContentService } from "../../services/publicContentService";
import {
  Breadcrumbs,
  CTASection,
  EmptyContentState,
  NewsCard,
  PublicPageHeader,
  SectionContainer,
  Seo,
  ServiceCard,
  StatusBadge,
} from "../../components/public/PublicComponents";
import { useAuth } from "@/features/auth";
import { ContactForm } from "@/features/public-site";

const pendingBlocks = [
  "Quiénes somos",
  "Historia",
  "Misión",
  "Visión",
  "Objetivos",
  "Junta Directiva",
];
const transparencyGroups = [
  { title: 'Información pública', items: ['Documentos públicos', 'Informes', 'Proyectos'] },
  { title: 'Rendición de cuentas', items: ['Rendición de cuentas', 'Reportes administrativos', 'Reportes financieros autorizados'] },
  { title: 'Marco institucional', items: ['Información relacionada con DINADECO'] },
] as const;
export function AboutPage() {
  return (
    <>
      <Seo
        title="Nosotros"
        description="Información institucional de ADI Curime."
      />
      <PublicPageHeader
        title="Nosotros"
        intro="Conozca la Asociación de Desarrollo Integral de Curime."
      />
      <Breadcrumbs current="Nosotros" />
      <SectionContainer className="space-y-10 md:space-y-14">
        <section className="grid gap-8 border-b border-brand-sage/70 pb-10 lg:grid-cols-[minmax(0,7fr)_minmax(15rem,4fr)] lg:items-start lg:gap-16">
          <div><p className="public-eyebrow text-brand-primary">La Asociación</p><h2 className="public-heading mt-3 text-brand-ink">Una institución al servicio de Curime</h2><p className="mt-5 max-w-2xl text-body-large leading-relaxed text-foreground-muted">La información institucional se publicará en este espacio una vez que sea revisada y autorizada por la Asociación.</p></div>
          <aside className="border-l-2 border-brand-accent pl-5 text-body-small leading-relaxed text-foreground-muted"><p>Este portal no sustituye los acuerdos, documentos o comunicados oficiales de la ADI.</p></aside>
        </section>
        <section aria-labelledby="identity-title" className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10"><div><p className="public-eyebrow text-brand-primary">Identidad institucional</p><h2 id="identity-title" className="public-heading mt-3 text-brand-ink">Historia, misión y visión</h2></div><div className="grid gap-px overflow-hidden rounded-surface border border-brand-sage/75 bg-brand-sage/75 sm:grid-cols-3">{pendingBlocks.slice(0, 3).map(title => <article key={title} className="bg-card-white p-5"><h3 className="font-heading text-heading-3 text-brand-ink">{title}</h3><p className="mt-3 text-body-small leading-relaxed text-foreground-muted">{site.pending}</p></article>)}</div></section>
        <section aria-labelledby="governance-title" className="rounded-surface border border-brand-sage/75 bg-surface-muted p-6 md:p-8"><div className="grid gap-7 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-10"><div><p className="public-eyebrow text-brand-primary">Organización</p><h2 id="governance-title" className="public-heading mt-3 text-brand-ink">Objetivos y Junta Directiva</h2></div><div className="grid gap-4 sm:grid-cols-2">{pendingBlocks.slice(3).map(title => <div key={title} className="border-t border-brand-sage/70 pt-4"><h3 className="font-heading text-heading-3 text-brand-ink">{title}</h3><p className="mt-2 text-body-small leading-relaxed text-foreground-muted">{site.pending}</p></div>)}</div></div></section>
      </SectionContainer>
      <CTASection />
    </>
  );
}
export function CommunityPage() {
  return (
    <>
      <Seo title="Comunidad" description="Espacio comunitario de Curime." />
      <PublicPageHeader
        title="Comunidad"
        intro="Un espacio para las iniciativas, actividades y proyectos de Curime."
      />
      <Breadcrumbs current="Comunidad" />
      <SectionContainer className="space-y-10 md:space-y-14">
        <section className="grid gap-7 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-center lg:gap-14"><figure className="overflow-hidden rounded-surface border border-brand-sage/75 bg-surface-muted shadow-sm"><img src="/images/public/home/community-curime-wide.webp" alt="Actividad comunitaria en la cancha de la comunidad." width="1500" height="1000" className="aspect-[16/10] size-full object-cover" /><figcaption className="border-t border-brand-sage/70 bg-card-white p-4 text-body-small text-foreground-muted">Fotografía autorizada de actividad comunitaria.</figcaption></figure><div><p className="public-eyebrow text-brand-primary">Curime</p><h2 className="public-heading mt-3 text-brand-ink">Un espacio para participar y encontrarse</h2><p className="mt-5 max-w-xl text-body-large leading-relaxed text-foreground-muted">Esta sección reunirá información autorizada sobre iniciativas, proyectos y actividades de la comunidad.</p></div></section>
        <section aria-labelledby="initiatives-title" className="grid gap-5 md:grid-cols-2"><div className="rounded-surface border border-brand-sage/75 bg-card-white p-6 shadow-sm"><p className="public-eyebrow text-brand-primary">Participación local</p><h2 id="initiatives-title" className="mt-3 font-heading text-heading-2 font-normal text-brand-ink">Iniciativas comunitarias</h2><p className="mt-4 text-body-small leading-relaxed text-foreground-muted">{site.pending}</p></div><div className="rounded-surface border border-brand-sage/75 bg-brand-deep p-6 text-brand-ivory shadow-sm"><p className="public-eyebrow text-brand-accent">Desarrollo compartido</p><h2 className="mt-3 font-heading text-heading-2 font-normal">Proyectos comunitarios</h2><p className="mt-4 text-body-small leading-relaxed text-brand-ivory/80">{site.pending}</p></div></section>
        <section aria-labelledby="activities-title" className="border-y border-brand-sage/70 py-8 md:py-10"><div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"><div><p className="public-eyebrow text-brand-primary">Vida comunitaria</p><h2 id="activities-title" className="public-heading mt-3 text-brand-ink">Actividades y galería</h2></div><div className="grid gap-4 sm:grid-cols-2"><div><h3 className="font-heading text-heading-3 text-brand-ink">Actividades</h3><p className="mt-2 text-body-small leading-relaxed text-foreground-muted">{site.pending}</p></div><div><h3 className="font-heading text-heading-3 text-brand-ink">Galería comunitaria</h3><p className="mt-2 text-body-small leading-relaxed text-foreground-muted">Se incorporarán fotografías adicionales cuando cuenten con autorización institucional.</p></div></div></div></section>
      </SectionContainer>
    </>
  );
}
export function NewsPage() {
  const verifiedNews = publicContentService.listNews().filter((item) => item.date !== 'Próximamente');
  return (
    <>
      <Seo
        title="Noticias"
        description="Noticias y comunicados de ADI Curime."
      />
      <PublicPageHeader
        title="Noticias"
        intro="Comunicados y novedades oficiales de la Asociación."
      />
      <Breadcrumbs current="Noticias" />
      <SectionContainer>
        {verifiedNews.length === 0 ? <EmptyContentState title="No hay noticias verificadas publicadas" text="Los comunicados y noticias oficiales aparecerán aquí cuando la Asociación los autorice." /> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {verifiedNews.map((item) => (
            <NewsCard key={item.slug} item={item} />
          ))}
        </div>}
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
      <Seo title={item.title} description={item.excerpt} />
      <Breadcrumbs current="Noticias" />
      <SectionContainer className="max-w-3xl">
        {isPending ? <EmptyContentState title="Esta noticia está en preparación" text="El contenido de esta ruta aún no corresponde a un comunicado publicado. Consulte el listado de noticias para futuras publicaciones autorizadas." /> : <>
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
    volunteering: [],
    entrepreneurship: [],
    donations: [],
  } as const;

  return (
    <>
      <Seo title="Servicios" description="Servicios digitales de ADI Curime." />
      <PublicPageHeader
        title="Servicios"
        intro="Conozca los servicios disponibles para la comunidad."
      />
      <Breadcrumbs current="Servicios" />
      <SectionContainer>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((item) => (
            <ServiceCard key={item.key} service={item} enabled={moduleAvailability[item.key].enabled} actions={serviceActions[item.key]} />
          ))}
          {!isAuthenticated && moduleAvailability.userRegistration.enabled && (
            <article className="flex min-h-60 flex-col rounded-surface border border-brand-sage/75 bg-card-white p-6 shadow-sm">
              <StatusBadge status="disponible" />
              <h3 className="mt-5 font-heading text-heading-2 font-normal text-brand-ink">Crear una cuenta</h3>
              <p className="mt-3 flex-1 text-body-small leading-relaxed text-foreground-muted">Cree su cuenta para acceder a los servicios digitales disponibles.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link className="inline-flex min-h-11 items-center rounded-control bg-brand-deep px-4 text-body-small font-bold text-brand-ivory transition-colors hover:bg-brand-primary focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring" to="/register">Crear una cuenta</Link>
                <Link className="inline-flex min-h-11 items-center rounded-control border border-brand-deep px-4 text-body-small font-bold text-brand-deep transition-colors hover:bg-brand-ivory focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring" to="/login">Iniciar sesión</Link>
              </div>
            </article>
          )}
        </div>
      </SectionContainer>
    </>
  );
}
export function TransparencyPage() {
  return (
    <>
      <Seo
        title="Transparencia"
        description="Información pública y transparencia de ADI Curime."
      />
      <PublicPageHeader
        title="Transparencia"
        intro="Un espacio preparado para publicar información institucional autorizada."
      />
      <Breadcrumbs current="Transparencia" />
      <SectionContainer className="space-y-10 md:space-y-14">
        <section className="max-w-3xl border-l-2 border-brand-accent pl-5"><p className="text-body-large leading-relaxed text-foreground-muted">La información se publica únicamente cuando cuenta con autorización institucional. Por el momento, no hay documentos disponibles para descarga.</p></section>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">{transparencyGroups.map((group) => <section key={group.title} className="border-t border-brand-sage/75 pt-5 first:border-t-0 first:pt-0 lg:first:border-t lg:first:pt-5"><h2 className="font-heading text-heading-2 font-normal text-brand-ink">{group.title}</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{group.items.map(title => <div key={title} className="rounded-control border border-border-subtle bg-card-white p-4"><h3 className="font-semibold text-brand-ink">{title}</h3><p className="mt-2 text-body-small leading-relaxed text-foreground-muted">{site.pending}</p></div>)}</div></section>)}</div>
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
      />
      <Breadcrumbs current="Contacto" />
      <SectionContainer>
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] lg:gap-12 xl:gap-16">
          <div className="min-w-0 lg:py-4">
            <p className="eyebrow">Contacto</p>
            <h2 className="mt-2 text-heading-1 text-brand-deep">Contáctese con nosotros</h2>
            <h3 className="mt-5 text-heading-3 text-brand-primary">Consultas generales</h3>
            <p className="mt-3 max-w-xl text-body-large text-foreground-muted">
              Este formulario permite preparar consultas dirigidas a la Asociación de Desarrollo Integral de Curime.
            </p>
            <div className="mt-8 grid gap-4" aria-label="Canales oficiales de contacto">
              {channels.map(({ name, detail, action, ariaLabel, href, icon: Icon, external }) => (
                <article key={name} className="grid min-w-0 grid-cols-[auto_1fr] gap-4 rounded-lg border border-border bg-surface p-4 shadow-sm">
                  <div aria-hidden="true" className="grid size-11 place-items-center rounded-lg bg-brand-soft/20 text-brand-deep">
                    <Icon className="size-5" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-brand-deep">{name}</h4>
                    <p className="mt-1 [overflow-wrap:anywhere] text-body-small text-foreground-muted">{detail}</p>
                    <a
                      className="mt-2 inline-flex min-h-11 items-center rounded-md font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-deep"
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
      </SectionContainer>
    </>
  );
}
