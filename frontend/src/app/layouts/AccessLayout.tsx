import { ArrowLeft } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

export function AccessLayout() {
  return (
    <div className="min-h-dvh bg-brand-ivory font-sans text-brand-ink lg:grid lg:grid-cols-[45%_55%]">
      <aside className="relative overflow-hidden bg-brand-deep px-5 py-6 text-brand-ivory sm:px-8 lg:flex lg:min-h-dvh lg:flex-col lg:justify-between lg:px-12 lg:py-10 xl:px-16">
        <Link to="/" aria-label="ADI Curime, inicio" className="relative z-10 inline-flex items-center gap-3 rounded-md no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent">
          <span aria-hidden="true" className="grid size-12 place-items-center rounded-[50%_50%_45%_45%] bg-brand-accent font-heading text-xl font-bold text-brand-deep">ADI</span>
          <span>
            <strong className="block font-heading text-2xl font-bold leading-none">ADI Curime</strong>
            <small className="mt-1 block text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-brand-accent">Asociación de Desarrollo Integral</small>
          </span>
        </Link>
        <div className="relative z-10 mt-6 hidden max-w-md lg:block">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accent">Curime, Nicoya</p>
          <p className="mt-4 font-heading text-heading-1 font-bold">Un acceso cercano a la gestión de nuestra comunidad.</p>
          <p className="mt-5 max-w-sm leading-relaxed text-brand-ivory/80">Ingrese, solicite su cuenta o recupere el acceso desde un espacio seguro de la Asociación.</p>
        </div>
        <div aria-hidden="true" className="absolute -bottom-28 -right-24 size-80 rounded-full bg-brand-primary/70 lg:size-96" />
        <div aria-hidden="true" className="absolute bottom-20 right-16 size-28 rounded-full bg-brand-accent/90" />
      </aside>
      <div className="flex min-h-[calc(100dvh-96px)] flex-col px-4 py-6 sm:px-6 sm:py-8 lg:min-h-dvh lg:px-10 xl:px-16">
        <div className="mx-auto flex w-full max-w-[32rem] flex-1 items-center">
          <div className="w-full rounded-xl border border-border bg-surface p-5 shadow-lg sm:p-8 lg:p-10">
            <Outlet />
          </div>
        </div>
        <footer className="mx-auto mt-5 w-full max-w-[32rem] text-center">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold text-brand-deep no-underline hover:bg-brand-soft/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep">
            <ArrowLeft className="size-4" aria-hidden="true" /> Volver al sitio
          </Link>
        </footer>
      </div>
    </div>
  )
}
