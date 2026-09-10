import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, CalendarPlus, FileText, Handshake, HeartHandshake, Store, UsersRound } from 'lucide-react'
import { CurimeGrecaDivider } from '@/shared/ui/brand/CurimeGrecaDivider'

const portalLinks = [
  { icon: CalendarPlus, title: 'Reservas', text: 'Solicite el uso de un espacio comunitario.', to: '/app/reservations/new', layout: '' },
  { icon: UsersRound, title: 'Comunidad', text: 'Conozca los espacios comunitarios de la Asociación.', to: '/comunidad', layout: '' },
  { icon: Handshake, title: 'Afiliación', text: 'Inicie una gestión de afiliación comunitaria.', to: '/afiliacion', layout: '' },
  { icon: FileText, title: 'Transparencia', text: 'Consulte información pública autorizada.', to: '/transparencia', layout: 'lg:col-start-2' },
  { icon: CalendarDays, title: 'Eventos', text: 'Consulte la agenda publicada por la Asociación.', to: '/eventos', layout: '' },
] as const

const upcomingServices = [
  { icon: HeartHandshake, title: 'Voluntariado', text: 'Espacio de participación en preparación.' },
  { icon: Store, title: 'Emprendimientos', text: 'Directorio comunitario en preparación.' },
] as const

export function ServicesSection() {
  return (
    <section aria-labelledby="services-title" className="public-section relative bg-brand-ivory">
      <CurimeGrecaDivider className="absolute inset-x-0 top-0" />
      <div className="public-container">
        <header className="mx-auto max-w-3xl text-center">
          <p className="public-eyebrow text-brand-primary">
            Portal comunitario
          </p>
          <h2
            id="services-title"
            className="public-heading mt-3 text-brand-ink"
          >
            Encuentre lo que necesita
          </h2>
          <span aria-hidden="true" className="mx-auto mt-4 block h-1 w-16 rounded-full bg-brand-accent" />
        </header>
        <div className="mt-10 grid gap-4 md:mt-12 md:grid-cols-2 md:gap-5 lg:grid-cols-6 lg:gap-6">
          {portalLinks.map(({ icon: Icon, title, text, to, layout }) => (
            <article
              key={title}
              className={`group flex h-full flex-col items-start rounded-surface border border-brand-sage/80 bg-card-white p-6 text-left shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-1 hover:border-brand-primary/60 hover:shadow-md motion-reduce:transform-none md:p-7 lg:col-span-2 ${layout}`}
            >
              <span className="grid size-12 place-items-center rounded-surface bg-brand-accent/20 text-brand-deep md:size-14">
                <Icon className="size-5 md:size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-heading text-heading-3 font-normal text-brand-ink">{title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-brand-ink/75">{text}</p>
              <Link
                to={to}
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-control bg-brand-deep px-4 text-sm font-bold text-brand-ivory shadow-sm transition-colors hover:bg-brand-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-deep"
              >
                Consultar{' '}<span className="sr-only">sobre {title}</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
        <div className="mx-auto mt-12 max-w-4xl border-t border-brand-sage/80 pt-8 md:mt-16">
          <p className="public-eyebrow text-center text-brand-primary">En preparación</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2 md:gap-5">
            {upcomingServices.map(({ icon: Icon, title, text }) => (
              <article key={title} className="grid cursor-default grid-cols-[auto_1fr] gap-4 rounded-surface border border-brand-sage/70 bg-surface-muted/80 p-5 md:p-6">
                <span className="grid size-11 place-items-center rounded-surface bg-brand-ivory/80 text-brand-deep">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-heading text-heading-3 font-normal text-brand-ink/85">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-ink/70">{text}</p>
                  <span className="mt-4 inline-flex rounded-full border border-brand-sage/80 bg-brand-ivory/80 px-2.5 py-1 text-xs font-semibold text-foreground-muted">Próximamente</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
