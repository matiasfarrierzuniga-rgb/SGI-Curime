import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, FileText, Handshake, HeartHandshake, Store, UsersRound } from 'lucide-react'

const portalLinks = [
  { icon: UsersRound, title: 'Comunidad', text: 'Conozca los espacios comunitarios de la Asociación.', to: '/comunidad' },
  { icon: Handshake, title: 'Afiliación', text: 'Inicie una gestión de afiliación comunitaria.', to: '/afiliacion' },
  { icon: FileText, title: 'Transparencia', text: 'Consulte información pública autorizada.', to: '/transparencia' },
  { icon: CalendarDays, title: 'Eventos', text: 'Consulte la agenda publicada por la Asociación.', to: '/eventos' },
] as const

const upcomingServices = [
  { icon: HeartHandshake, title: 'Voluntariado', text: 'Espacio de participación en preparación.' },
  { icon: Store, title: 'Emprendimientos', text: 'Directorio comunitario en preparación.' },
] as const

export function ServicesSection() {
  return (
    <section aria-labelledby="services-title" className="public-section border-t border-soft-sage/70 bg-brand-ivory">
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
        <div className="mt-10 grid gap-4 md:mt-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {portalLinks.map(({ icon: Icon, title, text, to }) => (
            <article
              key={title}
              className="flex h-full flex-col items-center rounded-xl border border-soft-sage bg-card-white p-6 text-center transition-colors hover:border-sage lg:p-7"
            >
              <span className="grid size-14 place-items-center rounded-full bg-warm-ivory text-brand-deep">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-heading text-heading-3 font-normal text-brand-ink">{title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-brand-ink/70">{text}</p>
              <Link
                to={to}
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md px-2 font-bold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
              >
                Consultar{' '}<span className="sr-only">sobre {title}</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
        <div className="mx-auto mt-10 max-w-3xl border-t border-soft-sage pt-8 md:mt-12">
          <p className="public-eyebrow text-center text-brand-primary">En preparación</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {upcomingServices.map(({ icon: Icon, title, text }) => (
              <article key={title} className="grid grid-cols-[auto_1fr] gap-4 rounded-xl border border-soft-sage bg-soft-sage/35 p-5">
                <span className="grid size-12 place-items-center rounded-full bg-brand-ivory text-brand-deep">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-heading text-heading-3 font-normal text-brand-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-ink/70">{text}</p>
                  <span className="mt-3 block text-sm font-semibold text-foreground-muted">Próximamente</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
