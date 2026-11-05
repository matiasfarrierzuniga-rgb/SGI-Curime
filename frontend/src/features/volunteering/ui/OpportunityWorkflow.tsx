import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getErrorMessage } from '@/shared/lib/errors'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Input } from '@/shared/ui/input'
import { LoadingState } from '@/shared/ui/LoadingState'
import { Modal } from '@/shared/ui/Modal'
import { Textarea } from '@/shared/ui/textarea'
import { opportunitiesApi } from '../api/opportunities.api'
import { opportunitiesKeys } from '../hooks/useOpportunities'
import type { VolunteerApplication, VolunteerOpportunity } from '../model/opportunities.types'

const date = (value: string) => new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

export function OpportunityWorkflow({ opportunity, onClose }: { opportunity: VolunteerOpportunity; onClose: () => void }) {
  const client = useQueryClient()
  const [title, setTitle] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [error, setError] = useState('')
  const sessions = useQuery({ queryKey: [...opportunitiesKeys.detail(opportunity.id), 'sessions'], queryFn: () => opportunitiesApi.sessions(opportunity.id) })
  const applications = useQuery({ queryKey: [...opportunitiesKeys.detail(opportunity.id), 'applications'], queryFn: () => opportunitiesApi.applications(opportunity.id) })
  const invalidate = async () => { await client.invalidateQueries({ queryKey: opportunitiesKeys.all }) }
  const addSession = useMutation({ mutationFn: (input: { title?: string; startAt: string; endAt: string }) => opportunitiesApi.addSession(opportunity.id, input), onSuccess: invalidate })
  const publish = useMutation({ mutationFn: () => opportunitiesApi.publish(opportunity.id), onSuccess: invalidate })
  const close = useMutation({ mutationFn: () => opportunitiesApi.close(opportunity.id), onSuccess: invalidate })

  const add = async (event: FormEvent) => {
    event.preventDefault()
    const start = new Date(startAt)
    const end = new Date(endAt)
    if (!startAt || !endAt || start <= new Date() || start >= end) { setError('Indique una sesión futura con inicio anterior al fin.'); return }
    setError('')
    try { await addSession.mutateAsync({ title: title.trim() || undefined, startAt: start.toISOString(), endAt: end.toISOString() }); setTitle(''); setStartAt(''); setEndAt('') }
    catch (reason) { setError(getErrorMessage(reason, 'No fue posible registrar la sesión.')) }
  }

  const transition = async (action: 'publish' | 'close') => {
    setError('')
    try { if (action === 'publish') await publish.mutateAsync(); else await close.mutateAsync(); onClose() }
    catch (reason) { setError(getErrorMessage(reason, 'No fue posible cambiar el estado.')) }
  }

  return <Modal title={`Gestionar ${opportunity.title}`} onClose={onClose} busy={addSession.isPending || publish.isPending || close.isPending}>
    <div className="grid gap-7">
      <section className="grid gap-4"><h3 className="text-heading-3 font-semibold">Publicación</h3><p>Estado: <strong>{opportunity.status === 'DRAFT' ? 'Borrador' : opportunity.status === 'PUBLISHED' ? 'Publicada' : 'Cerrada'}</strong></p>
        {sessions.isPending ? <LoadingState label="Cargando sesiones..." /> : null}
        {sessions.isError ? <ErrorState title="No fue posible cargar las sesiones" message={getErrorMessage(sessions.error)} /> : null}
        {sessions.data?.length === 0 ? <p className="text-body-small text-text-secondary">Agregue una sesión futura antes de publicar.</p> : null}
        {sessions.data?.map(session => <p key={session.id} className="text-body-small">{session.title || 'Sesión'} · {date(session.startAt)} – {date(session.endAt)}</p>)}
        {opportunity.status === 'DRAFT' ? <form onSubmit={add} className="grid gap-3 rounded-control border border-border p-4"><h4 className="font-semibold">Agregar sesión</h4><label className="grid gap-1">Título (opcional)<Input value={title} maxLength={200} onChange={event => setTitle(event.target.value)} /></label><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1">Inicio<Input type="datetime-local" required value={startAt} onChange={event => setStartAt(event.target.value)} /></label><label className="grid gap-1">Fin<Input type="datetime-local" required value={endAt} onChange={event => setEndAt(event.target.value)} /></label></div><Button type="submit" disabled={addSession.isPending}>Registrar sesión</Button></form> : null}
        <div className="flex flex-wrap gap-3">{opportunity.status === 'DRAFT' ? <Button type="button" disabled={publish.isPending || !sessions.data?.length} onClick={() => void transition('publish')}>Publicar oportunidad</Button> : null}{opportunity.status === 'PUBLISHED' ? <Button type="button" variant="outline" disabled={close.isPending} onClick={() => void transition('close')}>Cerrar convocatoria</Button> : null}</div>
        {error ? <p role="alert" className="text-body-small text-destructive">{error}</p> : null}
      </section>
      <section className="grid gap-4 border-t border-border pt-6"><h3 className="text-heading-3 font-semibold">Postulaciones</h3>
        {applications.isPending ? <LoadingState label="Cargando postulaciones..." /> : null}
        {applications.isError ? <ErrorState title="No fue posible cargar postulaciones" message={getErrorMessage(applications.error)} /> : null}
        {applications.data?.length === 0 ? <EmptyState title="Sin postulaciones" description="Las solicitudes recibidas aparecerán aquí." /> : null}
        {applications.data?.map(application => <ApplicationReview key={application.id} application={application} onResolved={invalidate} />)}
      </section>
    </div>
  </Modal>
}

function ApplicationReview({ application, onResolved }: { application: VolunteerApplication; onResolved: () => Promise<void> }) {
  const [mode, setMode] = useState<'new' | 'existing' | null>(null)
  const [personId, setPersonId] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const approve = useMutation({ mutationFn: () => opportunitiesApi.approveApplication(application.id, mode === 'new' ? { createPerson: true } : { personId: Number(personId) }), onSuccess: onResolved })
  const reject = useMutation({ mutationFn: () => opportunitiesApi.rejectApplication(application.id, reason.trim()), onSuccess: onResolved })
  const decide = async (action: 'approve' | 'reject') => {
    if (action === 'approve' && !mode) { setError('Seleccione una persona existente o cree una nueva de forma explícita.'); return }
    if (action === 'approve' && mode === 'existing' && (!Number.isInteger(Number(personId)) || Number(personId) < 1)) { setError('Indique un ID de persona válido.'); return }
    if (action === 'reject' && !reason.trim()) { setError('Indique un motivo de rechazo.'); return }
    setError('')
    try { if (action === 'approve') await approve.mutateAsync(); else await reject.mutateAsync() }
    catch (value) { setError(getErrorMessage(value, 'No fue posible revisar la postulación.')) }
  }
  return <article className="grid gap-3 rounded-control border border-border p-4 text-body-small"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-semibold">{application.submittedFullName}</h4><span>{application.status === 'PENDING' ? 'Pendiente' : application.status === 'APPROVED' ? 'Aceptada' : application.status === 'REJECTED' ? 'Rechazada' : 'Retirada'}</span></div><p>Recibida: {date(application.requestedAt)}</p><p>Correo: {application.submittedEmail || 'No indicado'} · Teléfono: {application.submittedPhone || 'No indicado'}</p>{application.motivation ? <p className="whitespace-pre-wrap">{application.motivation}</p> : null}
    {application.status === 'PENDING' ? <div className="grid gap-3 border-t border-border pt-3"><p className="font-semibold">Aceptar con identidad revisada</p><label className="flex items-center gap-2"><input type="radio" name={`person-${application.id}`} checked={mode === 'new'} onChange={() => setMode('new')} />Crear persona nueva desde esta solicitud</label><label className="flex items-center gap-2"><input type="radio" name={`person-${application.id}`} checked={mode === 'existing'} onChange={() => setMode('existing')} />Vincular persona existente</label>{mode === 'existing' ? <label className="grid gap-1">ID de persona<Input type="number" min="1" value={personId} onChange={event => setPersonId(event.target.value)} /></label> : null}<label className="grid gap-1">Motivo de rechazo<Textarea value={reason} maxLength={1000} onChange={event => setReason(event.target.value)} /></label><div className="flex flex-wrap gap-2"><Button type="button" disabled={approve.isPending || reject.isPending} onClick={() => void decide('approve')}>Aceptar</Button><Button type="button" variant="outline" disabled={approve.isPending || reject.isPending} onClick={() => void decide('reject')}>Rechazar</Button></div>{error ? <p role="alert" className="text-destructive">{error}</p> : null}</div> : null}
  </article>
}
