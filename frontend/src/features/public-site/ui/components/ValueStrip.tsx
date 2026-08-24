import { Eye, LayoutDashboard, Landmark, UsersRound } from 'lucide-react'

const items = [
  { icon: LayoutDashboard, title: 'Gestión centralizada', text: 'Trámites y información de la Asociación en un solo lugar.' },
  { icon: UsersRound, title: 'Participación comunitaria', text: 'Espacios digitales para vecinas, vecinos e iniciativas locales.' },
  { icon: Eye, title: 'Transparencia', text: 'Información pública y rendición de cuentas accesible.' },
  { icon: Landmark, title: 'Servicios digitales', text: 'Gestiones habilitadas gradualmente por el SGI.' },
] as const

export function ValueStrip() {
  return (
    <section aria-label="Beneficios de SGI-Curime" className="relative z-10">
      <div className="mx-auto w-full max-w-[1060px] px-4 min-[375px]:px-6 md:-mt-14">
        <div className="grid grid-cols-1 gap-8 rounded-2xl bg-white px-6 py-8 shadow-[0_18px_40px_-24px_rgba(18,59,71,0.35)] min-[480px]:grid-cols-2 md:grid-cols-4 md:gap-0 md:px-4">
          {items.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex flex-col items-center gap-3 px-4 text-center md:border-l md:border-border md:first:border-l-0">
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
