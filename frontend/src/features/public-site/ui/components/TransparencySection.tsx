import { Link } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { CurimeGrecaPattern } from '@/shared/ui/brand/CurimeGrecaPattern'

export function TransparencySection() {
  return (
    <section aria-labelledby="transparency-title" className="relative isolate overflow-hidden bg-brand-deep py-12 text-brand-ivory md:py-16 xl:py-20">
      <CurimeGrecaPattern className="absolute inset-y-0 right-0 w-[70%] opacity-10 md:w-[56%] lg:w-[48%]" />
      <div className="public-container relative grid gap-9 md:gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-20">
        <div className="max-w-3xl">
          <div className="flex items-center gap-4">
            <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-surface bg-brand-accent text-brand-deep shadow-sm">
              <Eye className="size-6" aria-hidden="true" />
            </span>
            <p className="public-eyebrow text-brand-accent">Transparencia</p>
          </div>
          <h2 id="transparency-title" className="public-heading mt-6 max-w-[20ch] text-brand-ivory">
            Información pública, con claridad y responsabilidad
          </h2>
          <p className="mt-5 max-w-[60ch] text-body-large text-brand-ivory/90">
            Consulte información institucional autorizada por la Asociación y conozca cómo este portal prepara espacios de rendición de cuentas.
          </p>
        </div>
        <Link
          to="/transparencia"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-brand-accent px-6 py-3 text-center font-bold text-brand-deep shadow-md transition-[background-color,box-shadow] hover:bg-brand-accent/85 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ivory sm:w-auto sm:justify-self-start lg:justify-self-end"
        >
          Ir a transparencia
        </Link>
      </div>
    </section>
  )
}
