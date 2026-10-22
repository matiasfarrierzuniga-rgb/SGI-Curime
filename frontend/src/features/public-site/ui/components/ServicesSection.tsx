import { Link } from 'react-router-dom'
import { ArrowRight, CalendarPlus, FileText, UsersRound } from 'lucide-react'
import { CurimeBrandAccent } from '@/shared/ui/brand/CurimeBrandAccent'
import { CurimeGrecaDivider } from '@/shared/ui/brand/CurimeGrecaDivider'

const portalLinks = [
  { icon: UsersRound, title: 'Afiliación', text: 'Solicite su afiliación a la Asociación de Desarrollo Integral de Curime.', to: '/afiliacion', cta: 'Solicitar afiliación' },
  { icon: CalendarPlus, title: 'Reservas', text: 'Solicite el uso de un espacio comunitario.', to: '/servicios/reservas', cta: 'Realizar reserva' },
  { icon: FileText, title: 'Otros servicios', text: 'Consulte trámites y solicitudes disponibles.', to: '/servicios', cta: 'Ver servicios' },
] as const

export function ServicesSection() {
  return (
    <section aria-labelledby="services-title" className="relative isolate overflow-hidden bg-brand-ivory py-14 md:py-20">
      <CurimeGrecaDivider className="absolute inset-x-0 top-0" />
      <CurimeBrandAccent className="absolute -bottom-16 -right-14 h-80 w-64 opacity-[0.08] sm:-right-8 sm:h-96 sm:w-72 lg:-bottom-24 lg:right-[5%] lg:h-[30rem] lg:w-96" />
      <div className="public-container relative z-10 grid gap-8 lg:grid-cols-[minmax(15rem,3fr)_minmax(0,9fr)] lg:gap-12">
        <header className="max-w-2xl">
          <p className="public-eyebrow text-brand-primary">
            Portal comunitario
          </p>
          <h2
            id="services-title"
            className="public-heading mt-3 text-brand-ink"
          >
            Encuentre lo que necesita
          </h2>
          <p className="mt-4 max-w-[52ch] text-pretty text-body leading-relaxed text-brand-ink/75">
            Realice en línea las gestiones que la Asociación tiene disponibles para la comunidad.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          {portalLinks.map(({ icon: Icon, title, text, to, cta }) => (
            <article
              key={title}
              className="group flex min-h-52 flex-col items-start rounded-surface border border-brand-sage/80 bg-card-white p-5 text-left shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-primary hover:bg-brand-ivory hover:shadow-md focus-within:border-brand-primary focus-within:shadow-md motion-reduce:transform-none"
            >
              <span className="grid size-12 place-items-center rounded-control border border-brand-accent/45 bg-brand-accent/15 text-brand-deep transition-colors duration-200 group-hover:bg-brand-accent/25 group-focus-within:bg-brand-accent/25">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-heading text-heading-2 font-normal text-brand-ink">{title}</h3>
              <p className="mt-3 max-w-[34ch] flex-1 text-body-small leading-relaxed text-brand-ink/75">{text}</p>
              <Link
                to={to}
                className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-control border border-brand-deep bg-brand-deep px-4 text-body-small font-bold text-brand-ivory transition-[background-color,border-color,box-shadow] duration-200 hover:border-brand-primary hover:bg-brand-primary hover:shadow-sm focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                {cta}<span className="sr-only"> sobre {title}</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
