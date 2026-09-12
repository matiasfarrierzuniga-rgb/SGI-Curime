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
      <SectionContainer>
        <div className="info-grid">
          {pendingBlocks.map((title) => (
            <article className="content-card" key={title}>
              <h2>{title}</h2>
              <p>{site.pending}</p>
            </article>
          ))}
        </div>
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
      <SectionContainer>
        <div className="info-grid">
          {[
            "Curime",
            "Iniciativas comunitarias",
            "Proyectos comunitarios",
            "Actividades",
            "Galería futura",
          ].map((title) => (
            <article className="content-card" key={title}>
              <h2>{title}</h2>
              <p>{site.pending}</p>
            </article>
          ))}
        </div>
      </SectionContainer>
    </>
  );
}
export function NewsPage() {
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
        <div className="card-grid">
          {publicContentService.listNews().map((item) => (
            <NewsCard key={item.slug} item={item} />
          ))}
        </div>
      </SectionContainer>
    </>
  );
}
export function NewsDetailPage() {
  const { slug } = useParams();
  const item = slug ? publicContentService.getNews(slug) : undefined;
  if (!item) return <Navigate to="/noticias" replace />;
  return (
    <>
      <Seo title={item.title} description={item.excerpt} />
      <Breadcrumbs current="Noticias" />
      <SectionContainer className="article">
        <p className="eyebrow">
          {item.category} · {item.date}
        </p>
        <h1>{item.title}</h1>
        <p className="lead">{item.excerpt}</p>
        <p>{item.body}</p>
        <Link to="/noticias">Volver a noticias</Link>
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
        <div className="card-grid">
          {services.map((item) => (
            <ServiceCard key={item.key} service={item} enabled={moduleAvailability[item.key].enabled} actions={serviceActions[item.key]} />
          ))}
          {!isAuthenticated && moduleAvailability.userRegistration.enabled && (
            <article className="service-card">
              <StatusBadge status="disponible" />
              <h3>Crear una cuenta</h3>
              <p>Cree su cuenta para acceder a los servicios digitales disponibles.</p>
              <div className="actions">
                <Link className="button button-small" to="/register">Crear una cuenta</Link>
                <Link className="button button-small button-ghost" to="/login">Iniciar sesión</Link>
              </div>
            </article>
          )}
        </div>
      </SectionContainer>
    </>
  );
}
export function TransparencyPage() {
  const areas = [
    "Documentos públicos",
    "Informes",
    "Proyectos",
    "Rendición de cuentas",
    "Reportes administrativos",
    "Reportes financieros autorizados",
    "Información relacionada con DINADECO",
  ];
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
      <SectionContainer>
        <div className="info-grid">
          {areas.map((title) => (
            <EmptyContentState key={title} title={title} />
          ))}
        </div>
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
