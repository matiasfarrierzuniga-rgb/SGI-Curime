import { ArrowRight, ArrowUpRight, CalendarCheck, CalendarDays, ChevronRight, HandHeart, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'

const communityLinks = [
  {
    title: 'Eventos',
    description: 'Conocé las próximas actividades de nuestra comunidad.',
    to: '/eventos',
    icon: CalendarDays,
    accent: 'bg-background-subtle text-brand-green',
  },
  {
    title: 'Voluntariado',
    description: 'Descubrí oportunidades para colaborar con Curime.',
    to: '/voluntariado',
    icon: HandHeart,
    accent: 'bg-brand-ivory text-brand-brown',
  },
] as const

export function CommunityHomePage() {
  const { user } = useAuth()
  const displayName = user?.displayName?.trim()
  const greeting = displayName ? `¡Hola, ${displayName}!` : '¡Bienvenido a Mi Comunidad!'

  return (
    <div className="bg-brand-ivory/40">
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-12 lg:space-y-10 lg:px-8 lg:py-16">
        <header className="max-w-3xl space-y-3">
          <p className="public-eyebrow text-brand-brown">Tu espacio comunitario</p>
          <h1 className="font-heading text-heading-1 text-foreground-primary">
            {greeting}
          </h1>
          <p className="max-w-2xl text-body text-foreground-secondary">
            Participá, conocé nuestras actividades y utilizá los servicios de la ADI Curime.
          </p>
        </header>

        <section aria-labelledby="community-reservations-heading" className="overflow-hidden rounded-overlay border border-border-default bg-background-subtle shadow-surface">
          <div className="grid gap-7 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12 lg:p-10">
            <div className="max-w-2xl space-y-5">
              <span className="inline-flex size-14 items-center justify-center rounded-surface bg-white/75 text-brand-green" aria-hidden="true">
                <CalendarCheck className="size-7" strokeWidth={1.8} />
              </span>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-brown">
                  Servicio destacado
                </p>
                <h2 id="community-reservations-heading" className="max-w-xl font-heading text-heading-2 text-foreground-primary">
                  Reservá un espacio para tu actividad
                </h2>
                <p className="max-w-xl text-body-small text-foreground-secondary">
                  Realizá tu solicitud de reserva de manera sencilla desde nuestro sistema.
                </p>
              </div>
            </div>
            <Link
              to="/servicios/reservas"
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-control bg-brand-green px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-interaction-primary-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-focus"
            >
              Solicitar una reserva
              <ArrowRight className="size-5 shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section aria-labelledby="community-explore-heading" className="space-y-5">
          <div className="space-y-1">
            <h2 id="community-explore-heading" className="font-sans text-heading-3 font-semibold text-foreground-primary">
              Explorá tu comunidad
            </h2>
            <p className="text-body-small text-foreground-secondary">
              Actividades y oportunidades para participar.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {communityLinks.map(({ title, description, to, icon: Icon, accent }) => (
              <Link
                key={to}
                to={to}
                className="group flex min-h-48 flex-col items-start gap-4 rounded-surface border border-border-default bg-background-surface p-5 transition-colors hover:border-border-strong hover:bg-background-subtle/40 focus-visible:outline-offset-4 sm:p-6"
              >
                <span className={`flex size-12 items-center justify-center rounded-control ${accent}`} aria-hidden="true">
                  <Icon className="size-6" strokeWidth={1.8} />
                </span>
                <span className="flex w-full flex-1 items-end justify-between gap-4">
                  <span className="space-y-1">
                    <span className="block text-base font-semibold text-foreground-primary">{title}</span>
                    <span className="block text-body-small text-foreground-secondary">{description}</span>
                  </span>
                  <ArrowUpRight className="size-5 shrink-0 text-brand-green transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="community-account-heading" className="space-y-4">
          <h2 id="community-account-heading" className="font-sans text-heading-3 font-semibold text-foreground-primary">
            Tu espacio personal
          </h2>
          <Link
            to="/profile"
            className="group flex min-h-20 items-center gap-4 rounded-surface border border-border-default bg-background-surface p-4 transition-colors hover:border-border-strong hover:bg-background-subtle/40 focus-visible:outline-offset-4 sm:p-5"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-control bg-background-subtle text-brand-green" aria-hidden="true">
              <UserRound className="size-6" strokeWidth={1.8} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-foreground-primary">Mi perfil</span>
              <span className="block text-body-small text-foreground-secondary">Consultá tus datos y gestioná tu cuenta.</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-foreground-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  )
}
