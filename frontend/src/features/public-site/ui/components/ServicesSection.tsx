import { Link } from 'react-router-dom'
import { CalendarDays, FileText, Handshake, HeartHandshake, Store, UsersRound } from 'lucide-react'

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
    <section aria-labelledby="services-title" className="bg-brand-ivory py-20 md:py-24 xl:py-32">
      <div className="public-container">
        <header className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">
            Portal comunitario
          </p>
          <h2
            id="services-title"
            className="mt-3 font-heading text-heading-1 font-bold text-brand-ink"
          >
            Encuentre lo que necesita
          </h2>
          <span aria-hidden="true" className="mx-auto mt-4 block h-1 w-16 rounded-full bg-brand-accent" />
        </header>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-5">
          {portalLinks.map(({ icon: Icon, title, text, to }) => (
            <article
              key={title}
              className="flex flex-col gap-4 rounded-xl border border-border/70 bg-white p-6 shadow-sm"
            >
              <span className="grid size-12 place-items-center rounded-lg bg-brand-ivory text-brand-deep">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="font-heading text-heading-3 font-semibold text-brand-ink">{title}</h3>
              <p className="flex-1 text-sm leading-relaxed text-brand-ink/70">{text}</p>
              <Link
                to={to}
                className="inline-flex min-h-11 items-center font-bold text-brand-primary underline-offset-4 hover:underline"
              >
                Consultar{' '}<span className="sr-only">sobre {title}</span>
              </Link>
            </article>
          ))}
          {upcomingServices.map(({ icon: Icon, title, text }) => (
            <article key={title} className="flex flex-col gap-4 rounded-xl border border-border/70 bg-surface-muted/45 p-6">
              <span className="grid size-12 place-items-center rounded-lg bg-brand-soft/20 text-brand-deep">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="font-heading text-heading-3 font-semibold text-brand-ink">{title}</h3>
              <p className="flex-1 text-sm leading-relaxed text-brand-ink/70">{text}</p>
              <span className="text-sm font-semibold text-foreground-muted">Próximamente</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
