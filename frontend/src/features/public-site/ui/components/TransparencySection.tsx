import { Link } from 'react-router-dom'
import { Eye } from 'lucide-react'

export function TransparencySection() {
  return (
    <section aria-labelledby="transparency-title" className="public-section bg-brand-deep text-brand-ivory">
      <div className="public-container grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(13rem,1fr)] lg:items-end lg:gap-16">
        <div>
          <div className="flex items-center gap-4">
            <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-accent text-brand-brown">
              <Eye className="size-6" aria-hidden="true" />
            </span>
            <p className="public-eyebrow text-brand-ivory">Transparencia</p>
          </div>
          <h2 id="transparency-title" className="public-heading mt-6 max-w-[22ch]">
            Información pública, con claridad y responsabilidad
          </h2>
          <p className="mt-5 max-w-2xl text-body-large text-brand-ivory/80">
            Consulte información institucional autorizada por la Asociación y conozca cómo este portal prepara espacios de rendición de cuentas.
          </p>
        </div>
        <Link
          to="/transparencia"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-brand-primary px-6 py-3 text-center font-bold text-brand-ivory transition-colors hover:bg-brand-brown focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ivory md:w-auto md:justify-self-start lg:justify-self-end"
        >
          Ir a transparencia
        </Link>
      </div>
    </section>
  )
}
