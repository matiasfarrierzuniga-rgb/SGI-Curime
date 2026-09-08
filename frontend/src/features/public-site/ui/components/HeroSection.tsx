import { Link } from 'react-router-dom'
import { CalendarDays, FileText, Handshake } from 'lucide-react'

export function HeroSection() {
  return (
    <section aria-labelledby="hero-title" className="public-section bg-brand-ivory pt-14 md:pt-16 lg:pt-20">
      <div className="public-container grid items-center gap-10 md:grid-cols-[minmax(0,44fr)_minmax(0,56fr)] md:gap-12 lg:gap-16 xl:gap-24">
        <div className="flex min-w-0 flex-col md:self-center">
          <p className="public-eyebrow text-brand-primary">
            Curime • Nicoya, Guanacaste
          </p>
          <h1
            id="hero-title"
            className="public-heading mt-4 max-w-[16ch] text-display tracking-[-0.02em] text-brand-ink"
          >
            Curime, más cerca de su comunidad
          </h1>
          <p className="mt-6 max-w-[58ch] text-body-large leading-relaxed text-brand-ink/75 lg:mt-7">
            El portal de la Asociación de Desarrollo Integral de Curime reúne información pública, participación comunitaria y gestiones digitales habilitadas en un solo lugar.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:mt-9 lg:gap-4">
            <Link
              to="/nosotros"
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-brand-accent px-6 py-3 text-center font-bold text-brand-ink transition-colors hover:bg-brand-accent/85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-deep"
            >
              Conozca la Asociación
            </Link>
            <Link
              to="/servicios"
              className="inline-flex min-h-12 items-center justify-center rounded-md border-2 border-brand-deep px-6 py-3 text-center font-bold text-brand-deep transition-colors hover:bg-brand-deep hover:text-brand-ivory focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-deep"
            >
              Explore los servicios
            </Link>
          </div>
        </div>
        <div
          className="relative aspect-[16/10] w-full justify-self-stretch overflow-hidden rounded-[1.5rem_4.5rem_1.5rem_1.5rem] bg-brand-deep p-5 text-brand-ivory shadow-lg md:aspect-square md:rounded-[2rem_6rem_2rem_2rem] md:p-7 lg:aspect-[5/4] xl:aspect-[6/5] xl:rounded-[2.5rem_8rem_2.5rem_2.5rem] xl:p-9"
        >
          <span aria-hidden="true" className="absolute -bottom-[38%] -right-[14%] aspect-square w-[82%] rotate-[-8deg] rounded-[42%_58%_48%_52%] bg-sage/75" />
          <span aria-hidden="true" className="absolute right-[14%] top-[10%] aspect-square w-[clamp(3.5rem,8vw,6rem)] rotate-12 rounded-[62%_38%_55%_45%] bg-brand-accent" />
          <div className="relative flex h-full flex-col justify-end">
            <p className="public-eyebrow text-brand-accent">Portal comunitario</p>
            <p className="mt-3 max-w-[18ch] text-2xl font-semibold leading-tight md:text-3xl">Una gestión más clara para participar y avanzar.</p>
            <ul className="mt-6 grid gap-3 text-sm font-semibold sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
              <HeroPoint icon={FileText} label="Información pública" />
              <HeroPoint icon={Handshake} label="Participación" />
              <HeroPoint icon={CalendarDays} label="Gestiones habilitadas" />
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

function HeroPoint({ icon: Icon, label }: { icon: typeof FileText; label: string }) {
  return <li className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm"><Icon className="size-4 shrink-0 text-brand-accent" aria-hidden="true" /><span>{label}</span></li>
}
