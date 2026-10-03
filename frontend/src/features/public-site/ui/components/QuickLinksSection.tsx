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
    text: 'Explore espacios comunitarios para impulsar iniciativas locales.',
    to: '/comunidad',
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
      <div className="public-container py-4 md:py-5">
        <ul className="grid gap-px overflow-hidden rounded-surface border border-brand-sage/70 bg-brand-sage/70 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map(({ icon: Icon, title, text, to }) => (
            <li key={title} className="min-w-0 bg-card-white">
              <Link
                to={to}
                className="group flex min-h-36 flex-col p-4 transition-[background-color,color] duration-200 hover:bg-brand-ivory focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-ring md:min-h-40 md:p-5"
              >
                <span className="flex items-center justify-between gap-4 text-brand-primary">
                  <Icon className="size-5" aria-hidden="true" />
                  <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
                </span>
                <span className="mt-4 font-heading text-heading-3 font-semibold text-brand-ink">{title}</span>
                <span className="mt-2 max-w-[31ch] text-pretty text-body-small leading-relaxed text-brand-ink/75">{text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
