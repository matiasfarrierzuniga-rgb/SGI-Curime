import { Link } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { CurimeGrecaDivider } from '@/shared/ui/brand/CurimeGrecaDivider'
import { CurimeGrecaPattern } from '@/shared/ui/brand/CurimeGrecaPattern'

export function TransparencySection() {
  return (
    <section aria-labelledby="transparency-title" className="relative isolate overflow-hidden bg-brand-deep py-12 text-text-inverse md:py-16">
      <CurimeGrecaPattern className="absolute inset-y-0 right-0 w-[62%] opacity-[0.07] md:w-[46%]" />
      <CurimeGrecaDivider className="absolute inset-x-0 bottom-4 h-6 opacity-[0.08] md:bottom-5" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-brand-accent/80" />
      <div className="public-container relative z-10 grid gap-7 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-accent text-brand-ink shadow-sm">
              <Eye className="size-5" aria-hidden="true" />
            </span>
            <p className="public-eyebrow text-brand-accent">Transparencia</p>
          </div>
          <h2 id="transparency-title" className="public-heading mt-5 max-w-[23ch] text-text-inverse">
            Información pública para la comunidad
          </h2>
          <p className="mt-4 max-w-[58ch] text-pretty text-body text-text-inverse/85">
            Acceda al espacio institucional destinado a consultar información pública de la Asociación.
          </p>
        </div>
        <Link
          to="/transparencia"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-brand-accent px-6 py-3 text-center font-semibold text-brand-ink shadow-sm transition-[background-color,box-shadow] hover:bg-brand-accent/85 hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-text-inverse sm:w-auto sm:justify-self-start lg:justify-self-end"
        >
          Ir a transparencia
        </Link>
      </div>
    </section>
  )
}
