import { ArrowUpRight, Calendar1, PartyPopper, Store, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CategoryIcon } from '@/shared/ui/CategoryIcon'

const quickLinks = [
  {
    icon: UsersRound,
    tone: 'affiliates',
    title: 'Afiliación',
    text: 'Inicie una solicitud para formar parte de la Asociación.',
    to: '/afiliacion',
  },
  {
    icon: Calendar1,
    tone: 'reservations',
    title: 'Reservas',
    text: 'Consulte y solicite el uso de espacios comunitarios.',
    to: '/servicios',
  },
  {
    icon: PartyPopper,
    tone: 'events',
    title: 'Eventos',
    text: 'Revise actividades y encuentros publicados por la Asociación.',
    to: '/eventos',
  },
  {
    icon: Store,
    tone: 'entrepreneurship',
    title: 'Emprendimientos',
    text: 'Conozca emprendimientos locales publicados por la Asociación.',
    to: '/ventures',
  },
] as const

export function QuickLinksSection() {
  return (
    <section aria-labelledby="quick-links-title" className="border-y border-border/70 bg-surface-card py-10 md:py-12">
      <div className="public-container">
        <header className="mb-6 max-w-2xl"><p className="public-eyebrow text-brand-primary">Accesos prioritarios</p><h2 id="quick-links-title" className="public-heading mt-2 text-text-primary">Lo que puede hacer hoy</h2><p className="mt-3 text-body leading-relaxed text-foreground-muted">Accesos orientados a necesidades frecuentes de la comunidad.</p></header>
        <nav aria-label="Accesos comunitarios"><ul className="grid overflow-hidden rounded-surface border border-border/70 bg-surface-card sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map(({ icon: Icon, tone, title, text, to }) => (
            <li key={title} className="min-w-0 border-b border-border/70 last:border-b-0 sm:border-r sm:[&:nth-child(2n)]:border-r-0 sm:[&:nth-last-child(-n+2)]:border-b-0 lg:border-b-0 lg:[&:nth-child(2n)]:border-r lg:[&:last-child]:border-r-0">
              <Link
                to={to}
                className="group flex min-h-40 flex-col p-5 transition-[background-color,color] duration-200 hover:bg-surface-page focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-ring md:p-6"
              >
                <span className="flex items-center justify-between gap-4">
                  <CategoryIcon icon={Icon} tone={tone} />
                  <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
                </span>
                <span className="mt-4 font-heading text-heading-3 font-semibold text-text-primary">{title}</span>
                <span className="mt-2 max-w-[31ch] text-pretty text-body-small leading-relaxed text-text-primary/75">{text}</span>
              </Link>
            </li>
          ))}
        </ul></nav>
      </div>
    </section>
  )
}
