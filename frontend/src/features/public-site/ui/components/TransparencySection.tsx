import { Link } from 'react-router-dom'
import { Eye } from 'lucide-react'

export function TransparencySection() {
  return (
    <section aria-labelledby="transparency-title" className="bg-brand-deep py-20 text-brand-ivory md:py-24 xl:py-28">
      <div className="public-container grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-16">
        <div>
          <div aria-hidden="true" className="grid size-12 place-items-center rounded-lg bg-brand-accent text-brand-deep">
            <Eye className="size-6" />
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-brand-accent">Transparencia</p>
          <h2 id="transparency-title" className="mt-3 max-w-[22ch] font-heading text-heading-1 font-bold">
            Información pública, con claridad y responsabilidad
          </h2>
          <p className="mt-5 max-w-2xl text-body-large text-brand-ivory/80">
            Consulte información institucional autorizada por la Asociación y conozca cómo este portal prepara espacios de rendición de cuentas.
          </p>
        </div>
        <Link
          to="/transparencia"
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-brand-accent px-6 py-3 text-center font-bold text-brand-deep transition-colors hover:bg-brand-accent/85"
        >
          Ir a transparencia
        </Link>
      </div>
    </section>
  )
}
