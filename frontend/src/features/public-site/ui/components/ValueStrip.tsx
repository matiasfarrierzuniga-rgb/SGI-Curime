import { Eye, LayoutDashboard, Landmark, UsersRound } from 'lucide-react'

const items = [
  { icon: LayoutDashboard, title: 'Gestión centralizada', text: 'Trámites y información de la Asociación en un solo lugar.' },
  { icon: UsersRound, title: 'Participación comunitaria', text: 'Espacios digitales para vecinas, vecinos e iniciativas locales.' },
  { icon: Eye, title: 'Transparencia', text: 'Información pública y rendición de cuentas accesible.' },
  { icon: Landmark, title: 'Servicios digitales', text: 'Gestiones habilitadas gradualmente por el SGI.' },
] as const

export function ValueStrip() {
  return (
    <section aria-label="Beneficios de SGI-Curime" className="bg-brand-ivory pb-6 md:pb-10 lg:pb-12">
      <div className="public-container">
        <div className="grid grid-cols-1 gap-0 border-y border-brand-deep/15 bg-white/45 px-2 py-3 md:grid-cols-2 md:px-4 md:py-4 lg:grid-cols-4 lg:px-0">
          {items.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex flex-col items-center gap-3 border-b border-brand-deep/10 px-5 py-7 text-center last:border-b-0 md:px-7 md:even:border-l md:[&:nth-child(3)]:border-b-0 lg:border-b-0 lg:border-l lg:first:border-l-0">
              <span className="grid size-12 place-items-center rounded-full bg-brand-ivory text-brand-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="font-display text-lg font-normal text-brand-ink">{title}</h3>
              <p className="text-sm leading-relaxed text-brand-ink/70">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
