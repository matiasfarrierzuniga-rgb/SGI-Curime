import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { getErrorMessage } from '@/shared/lib/errors'
import { Badge } from '@/shared/ui/badge'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { Breadcrumbs, PublicPageContent } from '@/shared/ui/PublicPageLayout'
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

  return <><div className="public-container min-w-0"><Breadcrumbs current="Voluntariado" variant="simple" /></div><PublicPageContent className="min-w-0 max-w-4xl bg-surface-page" spacing="normal">
    <Link to="/voluntariado" className="inline-flex min-h-11 max-w-full items-center break-words font-semibold text-brand-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Volver a voluntariado</Link>
    {!opportunityId ? <ErrorState title="Oportunidad no disponible" message="La oportunidad solicitada no está disponible." /> : null}
    {opportunityId && opportunity.isPending ? <LoadingState label="Cargando oportunidad..." /> : null}
    {opportunityId && opportunity.isError ? <ErrorState title="Oportunidad no disponible" message={getErrorMessage(opportunity.error, 'La oportunidad solicitada no está disponible.')} /> : null}
    {opportunity.data ? <article className="mt-8 min-w-0 rounded-surface border border-border bg-surface-card p-5 shadow-sm md:p-10">
      {opportunity.data.acceptingApplications !== undefined ? <Badge variant={opportunity.data.acceptingApplications ? 'success' : 'neutral'} className="mb-4 max-w-full whitespace-normal text-left">{opportunity.data.acceptingApplications ? 'Postulaciones abiertas' : 'Convocatoria cerrada'}</Badge> : null}
      <h1 className="public-heading break-words text-balance text-heading-1 text-text-primary">{opportunity.data.title}</h1>
      {opportunity.data.description ? <p className="mt-6 break-words whitespace-pre-line text-pretty text-body leading-relaxed text-text-primary/80">{opportunity.data.description}</p> : null}
      <dl className="mt-8 grid min-w-0 gap-5 border-t border-border pt-6 text-body sm:grid-cols-2">
        {opportunity.data.location ? <div className="min-w-0"><dt className="font-semibold text-text-primary">Ubicación</dt><dd className="break-words">{opportunity.data.location}</dd></div> : null}
        {opportunity.data.applicationDeadline ? <div className="min-w-0"><dt className="font-semibold text-text-primary">Fecha límite</dt><dd className="break-words">{new Intl.DateTimeFormat('es-CR', { dateStyle: 'long' }).format(new Date(opportunity.data.applicationDeadline))}</dd></div> : null}
      </dl>
      {opportunity.data.acceptingApplications ? <>
        {!showForm ? <button type="button" onClick={() => setShowForm(true)} className="mt-8 min-h-11 w-full rounded-control bg-brand-deep px-5 font-semibold text-white hover:bg-brand-primary focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring sm:w-auto">Postularme como voluntario</button> : <VolunteerApplicationForm opportunityId={opportunity.data.id} />}
        {!isAuthenticated ? <p className="mt-5 break-words text-pretty text-body-small text-text-primary/75">Puede postularse sin cuenta. Si lo prefiere, <Link className="font-semibold text-brand-primary underline" to="/login">Iniciar sesión</Link> o <Link className="font-semibold text-brand-primary underline" to="/register">Crear una cuenta</Link>.</p> : null}
      </> : <p role="status" className="mt-8 text-body font-semibold text-text-primary">Convocatoria cerrada para nuevas postulaciones.</p>}
    </article> : null}
  </PublicPageContent></>
}
