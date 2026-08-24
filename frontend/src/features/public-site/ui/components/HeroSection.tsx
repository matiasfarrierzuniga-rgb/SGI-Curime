import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'

export function HeroSection() {
  const { isAuthenticated } = useAuth()
  return (
    <section aria-labelledby="hero-title" className="bg-brand-ivory">
      <div className="mx-auto grid w-full max-w-[1180px] items-stretch gap-10 px-4 pt-12 min-[375px]:px-6 md:grid-cols-2 md:gap-0 md:pt-16 lg:pt-20">
        <div className="flex flex-col justify-center pb-10 md:pr-10 md:pb-20 lg:pr-16 lg:pb-24">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">
            Curime • Nicoya, Guanacaste
          </p>
          <h1
            id="hero-title"
            className="mt-4 font-display text-[clamp(3rem,5vw,5rem)] font-normal leading-[1.02] tracking-[-0.02em] text-brand-ink"
          >
            Gestión y desarrollo para nuestra comunidad
          </h1>
          <p className="mt-6 max-w-[520px] text-lg leading-relaxed text-brand-ink/75">
            SGI-Curime acompaña a la Asociación de Desarrollo Integral de Curime: información oficial clara, participación cercana y gestión transparente para la comunidad.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/nosotros"
              className="inline-flex h-12 items-center justify-center rounded-md bg-brand-accent px-6 font-bold text-brand-ink transition-colors hover:bg-brand-accent/85"
            >
              Conozca la Asociación
            </Link>
            <Link
              to={isAuthenticated ? '/app' : '/register'}
              className="inline-flex h-12 items-center justify-center rounded-md border-2 border-brand-deep px-6 font-bold text-brand-deep transition-colors hover:bg-brand-deep hover:text-brand-ivory"
            >
              {isAuthenticated ? 'Ir al SGI' : 'Solicitar una cuenta'}
            </Link>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="relative min-h-[280px] overflow-hidden bg-brand-deep rounded-2xl md:min-h-[500px] md:rounded-l-full md:rounded-r-none lg:min-h-[540px]"
        >
          <span className="absolute right-[14%] top-[12%] aspect-square w-[clamp(6rem,14vw,11rem)] rounded-full bg-brand-accent" />
          <span className="absolute -bottom-[16%] -right-[45%] aspect-[1.8] w-[120%] -rotate-[7deg] rounded-[50%_50%_0_0] bg-brand-soft/90" />
          <span className="absolute -bottom-[20%] -left-[40%] aspect-[1.8] w-[120%] -rotate-[7deg] rounded-[50%_50%_0_0] bg-brand-primary" />
          <svg
            viewBox="0 0 200 24"
            preserveAspectRatio="none"
            className="absolute bottom-6 left-1/2 h-6 w-40 -translate-x-1/2 text-brand-ivory/30"
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              d="M4 14 Q 22 4 40 14 T 76 14 T 112 14 T 148 14 T 184 14"
            />
          </svg>
          <svg
            viewBox="0 0 48 48"
            className="absolute left-[10%] top-[16%] h-10 w-10 text-brand-ivory/25"
          >
            <path
              fill="currentColor"
              d="M24 4 C14 12 10 22 12 32 C18 30 26 24 28 14 C29 10 27 6 24 4 Z M20 34 C16 38 12 40 8 42 C16 44 24 42 28 36 Z"
            />
          </svg>
        </div>
      </div>
    </section>
  )
}
