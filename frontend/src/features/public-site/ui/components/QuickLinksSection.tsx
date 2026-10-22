import { ArrowUpRight, CalendarDays, HandHeart, Sprout, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'

const quickLinks = [
  {
    icon: UsersRound,
    title: 'Nuestra comunidad',
    text: 'Conozca iniciativas, actividades y proyectos que nacen en Curime.',
    to: '/comunidad',
  },
  {
    icon: Sprout,
    title: 'Emprendimientos',
    text: 'Conozca emprendimientos locales publicados por la Asociación.',
    to: '/ventures',
  },
  {
    icon: HandHeart,
    title: 'Voluntariado',
    text: 'Súmese a acciones que fortalecen el bienestar de la comunidad.',
    to: '/comunidad',
  },
  {
    icon: CalendarDays,
    title: 'Agenda y eventos',
    text: 'Revise actividades y encuentros publicados por la Asociación.',
    to: '/eventos',
  },
] as const

export function QuickLinksSection() {
  return (
    <nav aria-label="Accesos comunitarios" className="border-y border-brand-sage/70 bg-surface-muted">
      <div className="public-container grid gap-8 py-14 md:py-20 lg:grid-cols-[minmax(15rem,3fr)_minmax(0,9fr)] lg:gap-12">
        <header className="max-w-sm">
          <p className="public-eyebrow text-brand-primary">Descubrí Curime</p>
          <h2 className="public-heading mt-3 text-brand-ink">Una comunidad con identidad, oportunidades y futuro</h2>
          <p className="mt-4 text-pretty text-body leading-relaxed text-brand-ink/75">Conocé nuestra gente, iniciativas, emprendimientos, actividades y proyectos locales.</p>
          <Link to="/comunidad" className="mt-6 inline-flex min-h-11 items-center rounded-control bg-brand-deep px-5 text-body-small font-bold text-brand-ivory hover:bg-brand-primary focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">Explorar la comunidad</Link>
        </header>
        <ul className="grid gap-4 sm:grid-cols-2">
          {quickLinks.map(({ icon: Icon, title, text, to }) => (
            <li key={title} className="min-w-0 rounded-surface border border-brand-sage/70 bg-card-white shadow-sm">
              <Link
                to={to}
                className="group flex h-full min-h-48 flex-col p-3 transition-[background-color,color] duration-200 hover:bg-brand-ivory focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-ring md:min-h-52 md:p-4"
              >
                <span aria-hidden="true" className="grid aspect-[2/1] place-items-center rounded-control bg-surface-muted text-brand-primary">
                  <Icon className="size-7" />
                </span>
                <span className="mt-3 flex items-center justify-between gap-4 font-heading text-heading-3 font-semibold text-brand-ink"><span>{title}</span><ArrowUpRight className="size-4 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" /></span>
                <span className="mt-2 max-w-[31ch] text-pretty text-body-small leading-relaxed text-brand-ink/75">{text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
