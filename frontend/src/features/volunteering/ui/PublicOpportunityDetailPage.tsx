import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { getErrorMessage } from '@/shared/lib/errors'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { usePublicOpportunity } from '../hooks/usePublicOpportunities'
import { VolunteerApplicationForm } from './VolunteerApplicationForm'

export function PublicOpportunityDetailPage() {
  const { isAuthenticated } = useAuth()
  const { id = '' } = useParams()
  const parsedId = Number(id)
  const opportunityId = Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null
  const opportunity = usePublicOpportunity(opportunityId)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { if (opportunity.data) document.title = `${opportunity.data.title} | ADI Curime` }, [opportunity.data])

  return <section className="bg-brand-ivory py-14 md:py-20"><div className="public-container max-w-4xl">
    <Link to="/voluntariado" className="inline-flex min-h-11 items-center font-semibold text-brand-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Volver a voluntariado</Link>
    {!opportunityId ? <ErrorState title="Oportunidad no disponible" message="La oportunidad solicitada no está disponible." /> : null}
    {opportunityId && opportunity.isPending ? <LoadingState label="Cargando oportunidad..." /> : null}
    {opportunityId && opportunity.isError ? <ErrorState title="Oportunidad no disponible" message={getErrorMessage(opportunity.error, 'La oportunidad solicitada no está disponible.')} /> : null}
    {opportunity.data ? <article className="mt-8 rounded-surface border border-border bg-white p-6 shadow-sm md:p-10">
      <h1 className="public-heading text-brand-ink">{opportunity.data.title}</h1>
      {opportunity.data.description ? <p className="mt-6 whitespace-pre-line text-body leading-relaxed text-brand-ink/80">{opportunity.data.description}</p> : null}
      <dl className="mt-8 grid gap-5 border-t border-border pt-6 text-body sm:grid-cols-2">
        {opportunity.data.location ? <div><dt className="font-semibold text-brand-ink">Ubicación</dt><dd>{opportunity.data.location}</dd></div> : null}
        {opportunity.data.applicationDeadline ? <div><dt className="font-semibold text-brand-ink">Fecha límite</dt><dd>{new Intl.DateTimeFormat('es-CR', { dateStyle: 'long' }).format(new Date(opportunity.data.applicationDeadline))}</dd></div> : null}
      </dl>
      {opportunity.data.acceptingApplications ? <>
        {!showForm ? <button type="button" onClick={() => setShowForm(true)} className="mt-8 min-h-11 rounded-control bg-brand-deep px-5 font-semibold text-brand-ivory hover:bg-brand-primary focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">Postularme como voluntario</button> : <VolunteerApplicationForm opportunityId={opportunity.data.id} />}
        {!isAuthenticated ? <p className="mt-5 text-body-small text-brand-ink/75">Puede postularse sin cuenta. Si lo prefiere, <Link className="font-semibold text-brand-primary underline" to="/login">Iniciar sesión</Link> o <Link className="font-semibold text-brand-primary underline" to="/register">Crear una cuenta</Link>.</p> : null}
      </> : <p role="status" className="mt-8 text-body font-semibold text-brand-ink">Convocatoria cerrada para nuevas postulaciones.</p>}
    </article> : null}
  </div></section>
}
