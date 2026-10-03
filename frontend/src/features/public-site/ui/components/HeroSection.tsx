import { Link } from 'react-router-dom'
import { CalendarDays, FileText, Handshake } from 'lucide-react'
import { CurimeBrandAccent } from '@/shared/ui/brand/CurimeBrandAccent'

export function HeroSection() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-brand-ivory py-12 md:py-16 lg:flex lg:min-h-[calc(100svh-var(--size-header-desktop))] lg:min-h-[calc(100dvh-var(--size-header-desktop))] lg:items-center lg:py-0">
      <CurimeBrandAccent className="absolute -right-14 top-1/2 hidden h-72 w-56 -translate-y-1/2 opacity-[0.07] md:block lg:right-[4%] lg:h-[22rem] lg:w-72" />
      <span aria-hidden="true" className="pointer-events-none absolute left-5 top-9 hidden size-1.5 rounded-full bg-brand-accent sm:block md:left-8 lg:left-[7%]" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-8 left-9 hidden h-px w-8 bg-brand-accent/80 sm:block md:bottom-12 lg:left-[9%]" />
      <div className="public-container relative z-10 flex flex-col gap-10 md:gap-12 lg:block lg:w-full lg:max-w-none lg:px-0">
        <div className="relative z-10 flex min-w-0 flex-col lg:absolute lg:inset-y-0 lg:left-0 lg:z-10 lg:flex lg:w-[46%] lg:justify-center lg:pl-12 lg:pr-8 xl:w-[40%] xl:pl-20 xl:pr-10">
          <p className="public-eyebrow text-brand-primary">
            CURIME · NICOYA · GUANACASTE
          </p>
          <h1 id="hero-title" className="public-heading mt-4 max-w-[14ch] text-display tracking-[-0.025em] text-brand-ink">
            Curime, más cerca de su comunidad
          </h1>
          <p className="mt-6 max-w-[54ch] text-body-large leading-relaxed text-brand-ink/75 lg:mt-7 lg:max-w-[45ch]">
            La Asociación de Desarrollo Integral de Curime pone a disposición de la comunidad un espacio para informarse, participar y realizar las gestiones disponibles.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:mt-9 lg:gap-4">
            <Link
              to="/servicios"
              className="inline-flex min-h-12 items-center justify-center rounded-control bg-primary px-6 py-3 text-center font-bold text-primary-foreground shadow-md transition-[background-color,box-shadow] hover:bg-interaction-primary-hover hover:shadow-lg focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              Explorar servicios
            </Link>
            <Link
              to="/nosotros"
              className="inline-flex min-h-12 items-center justify-center rounded-control border-2 border-primary bg-brand-ivory px-6 py-3 text-center font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              Conocer la Asociación
            </Link>
          </div>
        </div>
        <figure className="relative min-h-72 w-full overflow-hidden rounded-surface border border-brand-sage/70 bg-surface-muted shadow-surface md:min-h-0 md:aspect-[16/9] lg:h-[calc(100svh-var(--size-header-desktop))] lg:h-[calc(100dvh-var(--size-header-desktop))] lg:aspect-auto lg:rounded-none lg:border-0 lg:shadow-none">
          <picture className="absolute inset-0 block">
            <source media="(max-width: 767px)" srcSet="/images/public/home/hero-curime-mobile.webp" />
            <source srcSet="/images/public/home/hero-curime-wide.webp" />
            <img
              src="/images/public/home/hero-curime-fallback.jpg"
              alt="Paisaje rural con un gran árbol, potrero y cerca de madera."
              width="1600"
              height="1200"
              fetchPriority="high"
              loading="eager"
              className="size-full object-cover object-[58%_59%]"
            />
          </picture>
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-brand-ink/25 to-transparent lg:hidden" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 hidden w-[64%] bg-gradient-to-r from-brand-ivory via-brand-ivory/88 to-transparent lg:block" />
          <ul className="absolute inset-x-4 bottom-4 grid grid-cols-2 gap-2 text-xs font-semibold leading-snug text-brand-ink md:inset-x-6 md:bottom-6 md:grid-cols-3 lg:inset-x-auto lg:right-8 lg:bottom-8 lg:left-[50%]">
              <HeroPoint icon={FileText} label="Información pública" />
              <HeroPoint icon={Handshake} label="Participación" />
              <HeroPoint icon={CalendarDays} label="Gestiones habilitadas" />
          </ul>
        </figure>
      </div>
    </section>
  )
}

function HeroPoint({ icon: Icon, label }: { icon: typeof FileText; label: string }) {
  return <li className="flex min-h-10 items-center gap-2 rounded-control border border-brand-sage/70 bg-brand-ivory/80 px-2.5 py-1.5 shadow-sm backdrop-blur-sm last:col-span-2 md:last:col-auto"><Icon className="size-4 shrink-0 text-brand-primary" aria-hidden="true" /><span>{label}</span></li>
}
