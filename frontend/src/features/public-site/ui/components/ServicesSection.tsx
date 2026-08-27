import { Link } from 'react-router-dom'
import { CalendarDays, Handshake, HeartHandshake, Store } from 'lucide-react'

const services = [
  { icon: Handshake, title: 'Afiliación', text: 'Gestiones de afiliación comunitaria de la Asociación.' },
  { icon: CalendarDays, title: 'Reservas', text: 'Solicitud y seguimiento de espacios comunitarios.' },
  { icon: HeartHandshake, title: 'Voluntariado', text: 'Participación en iniciativas de la comunidad.' },
  { icon: Store, title: 'Emprendimientos', text: 'Apoyo y visibilidad para iniciativas locales.' },
] as const

export function ServicesSection() {
  return (
    <section aria-labelledby="services-title" className="bg-brand-ivory py-16 md:py-24 xl:py-28">
      <div className="public-container">
        <header className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">
            Nuestros servicios
          </p>
          <h2
            id="services-title"
            className="mt-3 font-display text-[clamp(2.25rem,4vw,3.5rem)] font-normal leading-tight text-brand-ink"
          >
            Herramientas para una gestión eficiente
          </h2>
          <span aria-hidden="true" className="mx-auto mt-4 block h-1 w-16 rounded-full bg-brand-accent" />
        </header>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4 xl:gap-8">
          {services.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="grid size-12 place-items-center rounded-full bg-brand-ivory text-brand-deep">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="font-display text-xl font-normal text-brand-ink">{title}</h3>
              <p className="flex-1 text-sm leading-relaxed text-brand-ink/70">{text}</p>
              <Link
                to="/servicios"
                className="text-sm font-bold text-brand-primary hover:underline"
              >
                Conocer más<span className="sr-only"> sobre {title}</span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
