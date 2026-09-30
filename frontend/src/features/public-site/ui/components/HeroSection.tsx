import { Link } from 'react-router-dom'
import { CalendarDays, FileText, Handshake } from 'lucide-react'
import { CurimeBrandAccent } from '@/shared/ui/brand/CurimeBrandAccent'

export function HeroSection() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-brand-ivory py-12 md:py-16">
      <CurimeBrandAccent className="absolute -right-14 top-1/2 hidden h-72 w-56 -translate-y-1/2 opacity-[0.07] md:block lg:right-[4%] lg:h-[22rem] lg:w-72" />
      <span aria-hidden="true" className="pointer-events-none absolute left-5 top-9 hidden size-1.5 rounded-full bg-brand-accent sm:block md:left-8 lg:left-[7%]" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-8 left-9 hidden h-px w-8 bg-brand-accent/80 sm:block md:bottom-12 lg:left-[9%]" />
      <div className="public-container relative z-10 grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(20rem,0.95fr)] md:gap-12 lg:grid-cols-[minmax(0,42fr)_minmax(0,58fr)] lg:gap-16 xl:gap-20">
        <div className="flex min-w-0 flex-col md:self-center">
          <p className="public-eyebrow text-brand-primary">
            Curime • Nicoya, Guanacaste
          </p>
          <h1 id="hero-title" className="public-heading mt-4 max-w-[14ch] text-display tracking-[-0.025em] text-brand-ink">
            Curime, más cerca de su comunidad
          </h1>
          <p className="mt-6 max-w-[54ch] text-body-large leading-relaxed text-brand-ink/75 lg:mt-7">
            El portal de la Asociación de Desarrollo Integral de Curime reúne información pública, participación comunitaria y gestiones digitales habilitadas en un solo lugar.
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
        <figure className="flex min-h-72 w-full flex-col justify-end overflow-hidden rounded-surface border border-brand-sage/70 bg-surface-muted p-6 text-brand-ink shadow-surface md:aspect-[5/4] md:min-h-0 md:p-8 lg:aspect-[6/5] xl:p-10">
          <div className="border-l-4 border-brand-accent pl-4 md:pl-5">
            <p className="public-eyebrow text-brand-primary">Portal comunitario</p>
            <p className="mt-3 max-w-[19ch] text-heading-2 font-semibold text-brand-ink">Espacio reservado para fotografía comunitaria validada.</p>
            <figcaption className="mt-3 max-w-[46ch] text-body-small text-brand-ink/75">Imagen temporal. Se reemplaza directamente por material oficial de la Asociación cuando esté disponible.</figcaption>
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-2 text-xs font-semibold leading-snug md:mt-7 md:grid-cols-1 md:gap-3 md:text-sm lg:grid-cols-3">
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
  return <li className="flex min-h-11 items-center gap-2 rounded-control border border-brand-sage/70 bg-brand-ivory/75 px-3 py-2 last:col-span-2 md:last:col-auto"><Icon className="size-4 shrink-0 text-brand-primary" aria-hidden="true" /><span>{label}</span></li>
}
