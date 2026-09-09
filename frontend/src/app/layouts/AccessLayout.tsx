import { ArrowLeft } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

export function AccessLayout() {
  return (
    <div className="relative isolate flex min-h-dvh items-center overflow-hidden bg-brand-ivory px-4 py-6 font-sans text-brand-ink sm:px-6 sm:py-10 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-36 -top-44 size-[29rem] rotate-[43deg] rounded-[5rem] bg-brand-red/90 sm:-right-24 sm:-top-48 lg:size-[34rem]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -left-44 size-[25rem] rounded-full bg-brand-maize/80 sm:-bottom-40 sm:-left-32 lg:size-[30rem]" />

      <div className="relative z-10 mx-auto grid min-h-0 w-full max-w-[1080px] overflow-hidden rounded-[20px] bg-card-white shadow-xl lg:min-h-[600px] lg:grid-cols-[42%_58%]">
        <aside className="relative overflow-hidden bg-brand-green px-6 py-7 text-brand-ivory sm:px-10 sm:py-9 lg:flex lg:flex-col lg:px-12 lg:py-11">
          <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-28 size-72 rounded-full border-[28px] border-brand-maize/25 lg:size-96" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -left-40 hidden size-80 rounded-full border border-brand-ivory/25 lg:block" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-14 right-8 hidden size-28 rounded-full border-[18px] border-brand-maize/20 lg:block" />

          <Link to="/" aria-label="CURIME, inicio" className="relative z-10 inline-flex w-fit items-center gap-3 rounded-md no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-maize">
            <span aria-hidden="true" className="grid size-11 place-items-center rounded-full border border-brand-maize/70 font-heading text-lg text-brand-maize">C</span>
            <span>
              <strong className="block font-heading text-2xl font-normal leading-none tracking-[0.04em] text-brand-ivory">CURIME</strong>
              <small className="mt-1.5 block max-w-[20rem] text-[0.62rem] font-bold uppercase leading-relaxed tracking-[0.13em] text-brand-maize">Asociación de Desarrollo Integral</small>
            </span>
          </Link>

          <div className="relative z-10 mt-8 lg:my-auto lg:mt-0">
            <p className="font-heading text-3xl leading-tight text-brand-ivory sm:text-4xl">¡Bienvenido a CURIME!</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-ivory/80 sm:text-base">Acceda a los servicios digitales de la Asociación desde un espacio claro, seguro y cercano.</p>
          </div>

          <p className="relative z-10 mt-7 text-xs font-bold uppercase tracking-[0.16em] text-brand-maize lg:mt-0">Nicoya · Guanacaste</p>
        </aside>

        <div className="flex min-w-0 flex-col bg-card-white px-5 py-6 sm:px-10 sm:py-9 lg:px-14 lg:py-11">
          <div className="mx-auto flex w-full max-w-[29rem] flex-1 items-center">
            <Outlet />
          </div>
          <footer className="mx-auto mt-5 w-full max-w-[29rem] border-t border-border-subtle pt-4 text-center">
            <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold text-brand-green no-underline hover:bg-brand-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red">
              <ArrowLeft className="size-4" aria-hidden="true" /> Volver al sitio
            </Link>
          </footer>
        </div>
      </div>
    </div>
  )
}
