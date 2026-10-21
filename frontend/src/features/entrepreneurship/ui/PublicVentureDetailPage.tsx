import { useEffect, type ReactNode } from 'react'
import { ChevronLeft, ExternalLink, Globe2, Mail, MapPin, Phone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getErrorMessage } from '@/shared/lib/errors'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { usePublicVenture } from '../hooks/usePublicVentures'
import type { PublicVenture } from '../model/publicVentures.types'

export function PublicVentureDetailPage() {
  const { id = '' } = useParams()
  const parsedId = Number(id)
  const ventureId = Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null
  const ventureQuery = usePublicVenture(ventureId)

  useEffect(() => {
    if (!ventureQuery.data) return
    document.title = `${ventureQuery.data.name} | ADI Curime`
  }, [ventureQuery.data])

  return (
    <section className="bg-brand-ivory py-14 md:py-20">
      <div className="public-container max-w-4xl">
        <Link className="inline-flex min-h-11 items-center gap-2 rounded-sm font-semibold text-brand-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary" to="/ventures"><ChevronLeft className="size-4" aria-hidden="true" />Volver a emprendimientos</Link>
        {!ventureId ? <ErrorState className="mt-10" title="Emprendimiento no disponible" message="El emprendimiento solicitado no está disponible." action={<Link className="inline-flex min-h-11 items-center rounded-md border border-border px-4 font-semibold" to="/ventures">Ver emprendimientos</Link>} /> : null}
        {ventureId && ventureQuery.isPending ? <LoadingState className="mt-10" label="Cargando emprendimiento..." /> : null}
        {ventureId && ventureQuery.isError ? <ErrorState className="mt-10" title="Emprendimiento no disponible" message={getErrorMessage(ventureQuery.error, 'El emprendimiento solicitado no está disponible.')} action={<Link className="inline-flex min-h-11 items-center rounded-md border border-border px-4 font-semibold" to="/ventures">Ver emprendimientos</Link>} /> : null}
        {ventureQuery.data ? <VentureDetail venture={ventureQuery.data} /> : null}
      </div>
    </section>
  )
}

function VentureDetail({ venture }: { venture: PublicVenture }) {
  const websiteUrl = validExternalUrl(venture.websiteUrl)
  const socialUrl = validExternalUrl(venture.socialUrl)
  const hasContact = venture.businessPhone || venture.businessEmail || websiteUrl || socialUrl

  return <article className="mt-8 rounded-xl border border-border bg-white p-6 shadow-sm md:p-10">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">Directorio comunitario</p>
    <h1 className="mt-3 font-heading text-heading-1 font-bold text-brand-ink">{venture.name}</h1>
    {venture.offerDescription ? <p className="mt-5 text-body-large leading-relaxed text-brand-ink/80">{venture.offerDescription}</p> : null}
    {venture.description ? <div className="mt-8 whitespace-pre-line text-body leading-relaxed text-brand-ink/80">{venture.description}</div> : null}
    {venture.locationText || hasContact ? <dl className="mt-8 grid gap-5 border-y border-border py-6 text-body text-brand-ink/80 sm:grid-cols-2">
      {venture.locationText ? <Detail icon={MapPin} label="Ubicación"><span>{venture.locationText}</span></Detail> : null}
      {venture.businessPhone ? <Detail icon={Phone} label="Teléfono"><a className="break-all text-brand-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary" href={`tel:${venture.businessPhone}`}>{venture.businessPhone}</a></Detail> : null}
      {venture.businessEmail ? <Detail icon={Mail} label="Correo electrónico"><a className="break-all text-brand-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary" href={`mailto:${venture.businessEmail}`}>{venture.businessEmail}</a></Detail> : null}
      {websiteUrl ? <ExternalDetail label="Sitio web" href={websiteUrl} /> : null}
      {socialUrl ? <ExternalDetail label="Red social" href={socialUrl} /> : null}
    </dl> : null}
  </article>
}

function Detail({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return <div className="flex gap-3"><Icon className="mt-0.5 size-5 shrink-0 text-brand-primary" aria-hidden="true" /><div><dt className="font-semibold text-brand-ink">{label}</dt><dd className="mt-1">{children}</dd></div></div>
}

function ExternalDetail({ label, href }: { label: string; href: string }) {
  return <Detail icon={Globe2} label={label}><a className="inline-flex break-all text-brand-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary" href={href} target="_blank" rel="noopener noreferrer">{href}<ExternalLink className="ml-1 mt-1 size-3 shrink-0" aria-hidden="true" /></a></Detail>
}

function validExternalUrl(value: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}
