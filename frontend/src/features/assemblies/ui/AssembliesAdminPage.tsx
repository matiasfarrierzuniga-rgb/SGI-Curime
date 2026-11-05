import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { getErrorMessage } from '@/shared/lib/errors'
import { hasCapability } from '@/shared/security/access'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Input } from '@/shared/ui/input'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatusMessage } from '@/shared/ui/StatusMessage'
import { useToast } from '@/shared/ui/Toast'
import { useAssemblies, useAssembly, useAssemblyMutations, useEligibleAffiliates } from '../hooks/useAssembliesQueries'
import type { AssemblyCallPayload, AssemblyDetail, AssemblyPayload, AssemblyQuorumType, AssemblyStatus, AttendanceStatus } from '../model/assemblies.types'

const initial: AssemblyPayload = { title: '', date: '', place: '', description: '', quorumType: 'FIXED', quorumValue: 1 }
const dateLabel = (value: string) => new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const statusLabel = (value: AssemblyStatus) => value === 'SCHEDULED' ? 'Programada' : value === 'IN_PROGRESS' ? 'En curso' : value === 'COMPLETED' ? 'Finalizada' : 'Cancelada'
const statusVariant = (value: AssemblyStatus): 'info' | 'warning' | 'success' | 'neutral' => value === 'SCHEDULED' ? 'info' : value === 'IN_PROGRESS' ? 'warning' : value === 'COMPLETED' ? 'success' : 'neutral'
const newCall = (callNumber: number): AssemblyCallPayload => ({ callNumber, scheduledAt: '', quorumType: 'FIXED', quorumValue: 1 })

export function AssembliesAdminPage({ assemblyId }: { assemblyId?: number } = {}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const canCreateAssembly = hasCapability(user?.permissionCodes, 'governance.assembly.create') || hasCapability(user?.permissionCodes, 'adm.assemblies.manage')
  const canRunSession = hasCapability(user?.permissionCodes, 'governance.assembly.session') || hasCapability(user?.permissionCodes, 'adm.assemblies.manage')
  const canRecordAttendance = hasCapability(user?.permissionCodes, 'governance.attendance.scan') || hasCapability(user?.permissionCodes, 'adm.assemblies.manage')
  const activeId = assemblyId ?? null
  const list = useAssemblies(canRunSession)
  const detail = useAssembly(activeId)
  const eligible = useEligibleAffiliates(activeId !== null && canCreateAssembly)
  const mutations = useAssemblyMutations()
  const { notify } = useToast()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [search, setSearch] = useState('')
  const [selectedPeople, setSelectedPeople] = useState<number[]>([])
  const [calls, setCalls] = useState<AssemblyCallPayload[]>([])

  // Legacy detail responses can omit calls; normalize only at presentation boundary.
  const item = detail.data ? { ...detail.data, calls: detail.data.calls ?? [] } : undefined
  const persistedPeople = detail.data?.convocations.map((person) => person.affiliateId) ?? []

  useEffect(() => {
    if (!detail.data) return
    setSelectedPeople(detail.data.convocations.map((person) => person.affiliateId))
    setCalls((detail.data.calls ?? []).map(({ callNumber, scheduledAt, quorumType, quorumValue }) => ({ callNumber, scheduledAt: scheduledAt.slice(0, 16), quorumType, quorumValue })))
    setSearch('')
  }, [detail.data])

  const people = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es')
    return (eligible.data ?? []).filter((person) => person.fullName.toLocaleLowerCase('es').includes(term))
  }, [eligible.data, search])
  const selectionChanged = selectedPeople.length !== persistedPeople.length || selectedPeople.some((id) => !persistedPeople.includes(id))
  const duplicateCallNumber = new Set(calls.map((call) => call.callNumber)).size !== calls.length
  const scheduledCallTimes = calls.filter((call) => call.scheduledAt).map((call) => call.scheduledAt)
  const duplicateCallTime = new Set(scheduledCallTimes).size !== scheduledCallTimes.length
  const callsReady = calls.length > 0 && !duplicateCallNumber && !duplicateCallTime && calls.every((call) => call.scheduledAt && Number.isInteger(call.callNumber) && call.callNumber > 0 && Number.isInteger(call.quorumValue) && call.quorumValue > 0 && (call.quorumType !== 'PERCENTAGE' || call.quorumValue <= 100))
  const callsDisabledReason = duplicateCallNumber ? 'Cada ronda debe tener un número distinto.' : duplicateCallTime ? 'Cada ronda debe tener una fecha y hora distintas.' : 'Complete fechas y valores de cuórum válidos para guardar.'

  const run = async (action: () => Promise<unknown>, fallback: string, success?: string) => {
    setError('')
    setFeedback('')
    try {
      await action()
      if (success) setFeedback(success)
    } catch (reason) {
      setError(getErrorMessage(reason, fallback))
    }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canCreateAssembly) return
    setError('')
    if (!form.title.trim() || !form.date || !form.place.trim()) return setError('Complete el título, la fecha y el lugar.')
    if (!Number.isInteger(form.quorumValue) || form.quorumValue <= 0 || (form.quorumType === 'PERCENTAGE' && form.quorumValue > 100)) return setError(form.quorumType === 'PERCENTAGE' ? 'El porcentaje debe ser un entero entre 1 y 100.' : 'La cantidad fija debe ser un entero mayor que cero.')
    try {
      const payload = { ...form, title: form.title.trim(), place: form.place.trim(), date: new Date(form.date).toISOString() }
      const saved = editingId ? await mutations.update.mutateAsync({ id: editingId, payload }) : await mutations.create.mutateAsync(payload)
      setCreating(false); setEditingId(null); setForm(initial); navigate(`/app/admin/assemblies/${saved.id}`)
    } catch (reason) { setError(getErrorMessage(reason, 'No fue posible guardar la asamblea.')) }
  }

  const remove = async () => {
    if (!canCreateAssembly || !activeId) return
    await run(async () => { await mutations.remove.mutateAsync(activeId); setDeleteOpen(false); navigate('/app/admin/assemblies'); notify('La asamblea fue eliminada.', 'success') }, 'No fue posible eliminar la asamblea porque contiene información histórica.')
  }
  const saveConvocations = (id: number) => { if (canCreateAssembly) void run(async () => { await mutations.convocations.mutateAsync({ id, affiliateIds: selectedPeople }); notify('Personas convocadas guardadas correctamente.', 'success') }, 'No fue posible guardar las personas convocadas.', 'Cambios locales de convocación guardados.') }
  const startAssembly = (id: number) => { if (canRunSession) void run(async () => { await mutations.start.mutateAsync(id); notify('Asamblea iniciada correctamente.', 'success') }, 'No fue posible iniciar la asamblea.', 'Asamblea iniciada correctamente.') }
  const setAttendance = (affiliateId: number, status: Extract<AttendanceStatus, 'PRESENT' | 'ABSENT'>) => { if (canRecordAttendance && activeId) void run(async () => { await mutations.attendance.mutateAsync({ id: activeId, entries: [{ affiliateId, status }] }) }, 'No fue posible actualizar la asistencia.', 'Asistencia actualizada.') }
  const completeAssembly = (id: number) => { if (canRunSession) void run(async () => { await mutations.complete.mutateAsync(id); notify('Asamblea finalizada correctamente.', 'success') }, 'No se puede finalizar mientras falten asistencias por registrar.', 'Asamblea finalizada correctamente.') }
  const saveCalls = (id: number) => { if (canCreateAssembly) void run(async () => { await mutations.calls.mutateAsync({ id, calls: calls.map((call) => ({ ...call, scheduledAt: new Date(call.scheduledAt).toISOString() })) }); notify('Rondas de convocatoria guardadas correctamente.', 'success') }, 'No fue posible guardar las rondas de convocatoria.', 'Rondas de convocatoria guardadas.') }

  return <section className="space-y-6">
    <PageHeader context="Gobierno institucional" title={item ? item.title : 'Asambleas'} description={item ? `${dateLabel(item.date)} · ${item.place}` : 'Organice convocatorias, sesión, asistencia y cuórum.'} actions={item ? <Button variant="outline" type="button" onClick={() => navigate('/app/admin/assemblies')}>Volver al listado</Button> : canCreateAssembly ? <Button type="button" onClick={() => { setEditingId(null); setForm(initial); setCreating((value) => !value) }}>{creating ? 'Cerrar formulario' : 'Crear asamblea'}</Button> : undefined} />
    <StatusMessage error={error} success={feedback} />

    {creating ? <form className="grid gap-4 rounded-xl border border-border bg-surface p-4 sm:p-5 md:grid-cols-2" onSubmit={submit} noValidate>
      <label className="grid gap-1.5 text-label font-semibold">Título o motivo<Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
      <label className="grid gap-1.5 text-label font-semibold">Fecha y hora<Input type="datetime-local" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
      <label className="grid gap-1.5 text-label font-semibold">Lugar<Input value={form.place} onChange={(event) => setForm({ ...form, place: event.target.value })} /></label>
      <label className="grid gap-1.5 text-label font-semibold">Modalidad del cuórum<select className="h-(--size-control) rounded-control border border-border bg-control px-(--spacing-control-x) text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" value={form.quorumType} onChange={(event) => setForm({ ...form, quorumType: event.target.value as AssemblyQuorumType })}><option value="FIXED">Cantidad fija</option><option value="PERCENTAGE">Porcentaje</option></select></label>
      <label className="grid gap-1.5 text-label font-semibold">{form.quorumType === 'FIXED' ? 'Cantidad mínima de personas' : 'Porcentaje mínimo'}<Input type="number" min="1" max={form.quorumType === 'PERCENTAGE' ? 100 : undefined} step="1" value={form.quorumValue} onChange={(event) => setForm({ ...form, quorumValue: Number(event.target.value) })} /></label>
      <label className="grid gap-1.5 text-label font-semibold md:col-span-2">Descripción<textarea className="min-h-24 rounded-control border border-border bg-control p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
      <Button loading={mutations.create.isPending || mutations.update.isPending} className="w-full sm:w-fit" type="submit">{editingId ? 'Guardar cambios' : 'Crear y continuar'}</Button>
    </form> : null}

    {!activeId && list.isPending ? <LoadingState label="Cargando asambleas..." /> : null}
    {!activeId && list.isError ? <ErrorState message={getErrorMessage(list.error, 'No fue posible cargar las asambleas.')} /> : null}
    {!activeId && list.data?.length === 0 ? <EmptyState title="No hay asambleas registradas" description="Cree la primera asamblea cuando tenga confirmados sus datos." /> : null}
    {!activeId && list.data?.length ? <div className="grid gap-3">{list.data.map((assembly) => <article key={assembly.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div className="space-y-1"><h2 className="font-semibold text-brand-ink">{assembly.title}</h2><p className="text-body-small text-foreground-muted">{dateLabel(assembly.date)} · {statusLabel(assembly.status)}</p><p className="text-body-small">Cuórum: {assembly.quorumType === 'FIXED' ? `${assembly.quorumValue} personas` : assembly.quorumType === 'PERCENTAGE' ? `${assembly.quorumValue}%` : 'Sin configuración histórica'}</p></div><Button variant="outline" className="w-full sm:w-auto" type="button" onClick={() => navigate(`/app/admin/assemblies/${assembly.id}`)}>Ver y gestionar</Button></article>)}</div> : null}
    {activeId && detail.isPending ? <LoadingState label="Cargando detalle..." /> : null}
    {activeId && detail.isError ? <ErrorState message={getErrorMessage(detail.error, 'No fue posible cargar el detalle de la asamblea.')} /> : null}

    {item ? <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="space-y-2"><h2 className="text-heading-3 font-semibold">Información de la asamblea</h2><Badge variant={statusVariant(item.status)}>{statusLabel(item.status)}</Badge></div>{item.status === 'SCHEDULED' && canCreateAssembly ? <div className="flex flex-col gap-2 sm:flex-row"><Button variant="outline" type="button" onClick={() => { setEditingId(item.id); setForm({ title: item.title, type: item.type ?? undefined, date: item.date.slice(0, 16), place: item.place, description: item.description ?? '', quorumType: item.quorumType ?? 'FIXED', quorumValue: item.quorumValue ?? 1 }); setCreating(true) }}>Editar datos</Button><Button variant="danger" type="button" onClick={() => setDeleteOpen(true)}>Eliminar asamblea</Button></div> : null}</div></section>

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-heading-3 font-semibold">Personas convocadas</h2><p className="mt-1 text-body-small text-foreground-muted">La selección local no se publica hasta guardar.</p></div><Badge variant={selectionChanged ? 'warning' : 'neutral'}>{selectedPeople.length} seleccionada{selectedPeople.length === 1 ? '' : 's'}</Badge></div>
        {item.status === 'SCHEDULED' && canCreateAssembly ? <>
          <label className="mt-4 grid max-w-xl gap-1.5 text-label font-semibold">Buscar persona<Input value={search} placeholder="Nombre de la persona" onChange={(event) => setSearch(event.target.value)} /></label>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-body-small text-foreground-muted" aria-live="polite"><span>{eligible.isPending ? 'Cargando…' : `${people.length} resultado${people.length === 1 ? '' : 's'}`}</span><span>Persistidas: {persistedPeople.length} · Locales: {selectedPeople.length}</span></div>
          {eligible.isPending ? <div className="mt-3"><LoadingState label="Cargando personas elegibles..." /></div> : null}
          {eligible.isError ? <div className="mt-3"><ErrorState message={getErrorMessage(eligible.error, 'No fue posible cargar las personas elegibles.')} /></div> : null}
          {!eligible.isPending && !eligible.isError && people.length === 0 ? <p className="mt-3 rounded-control border border-dashed border-border p-4 text-body-small text-foreground-muted">{search ? 'No hay personas que coincidan con la búsqueda. La selección actual se conserva.' : 'No hay personas elegibles para convocar.'}</p> : null}
          {!eligible.isPending && !eligible.isError && people.length > 0 ? <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto rounded-lg border border-border p-1" aria-label="Personas elegibles"><li className="sr-only">Seleccione personas para convocar</li>{people.map((person) => <li key={person.id}><label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-muted has-[:focus-visible]:bg-muted"><span className="sr-only">Seleccionar </span><Checkbox checked={selectedPeople.includes(person.id)} onCheckedChange={() => setSelectedPeople((current) => current.includes(person.id) ? current.filter((id) => id !== person.id) : [...current, person.id])} /><span className="min-w-0 flex-1 font-medium">{person.fullName}</span></label></li>)}</ul> : null}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center"><Button loading={mutations.convocations.isPending} disabled={!selectionChanged} type="button" onClick={() => saveConvocations(item.id)}>Guardar selección local</Button><div><Button variant="outline" aria-describedby={selectedPeople.length === 0 || selectionChanged ? 'start-assembly-help' : undefined} disabled={selectedPeople.length === 0 || selectionChanged || mutations.start.isPending} loading={mutations.start.isPending} type="button" onClick={() => startAssembly(item.id)}>Iniciar asamblea</Button>{selectedPeople.length === 0 ? <p id="start-assembly-help" className="mt-1 text-caption text-foreground-muted">Seleccione al menos una persona antes de iniciar.</p> : selectionChanged ? <p id="start-assembly-help" className="mt-1 text-caption text-foreground-muted">Guarde la selección local y espere la actualización de personas convocadas antes de iniciar.</p> : null}</div></div>
        </> : <ConvocationList item={item} />}
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5"><div><h2 className="text-heading-3 font-semibold">Rondas de convocatoria</h2><p className="mt-1 text-body-small text-foreground-muted">Configure fecha, modalidad y valor de cuórum para cada ronda. Los cambios se guardan por separado.</p></div>{item.status === 'SCHEDULED' && canCreateAssembly ? <><div className="mt-4 space-y-3">{calls.map((call, index) => <CallRoundEditor key={index} call={call} index={index} onChange={(next) => setCalls((current) => current.map((currentCall, currentIndex) => currentIndex === index ? next : currentCall))} onRemove={() => setCalls((current) => current.filter((_, currentIndex) => currentIndex !== index))} />)}</div>{calls.length === 0 ? <p className="mt-4 rounded-control border border-dashed border-border p-4 text-body-small text-foreground-muted">No hay rondas locales pendientes de guardar.</p> : null}<div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center"><Button variant="outline" type="button" onClick={() => setCalls((current) => [...current, newCall(current.length + 1)])}>Agregar ronda</Button><div><Button loading={mutations.calls.isPending} aria-describedby={calls.length > 0 && !callsReady ? 'call-rounds-help' : undefined} disabled={!callsReady} type="button" onClick={() => saveCalls(item.id)}>Guardar rondas</Button>{calls.length > 0 && !callsReady ? <p id="call-rounds-help" className="mt-1 text-caption text-foreground-muted">{callsDisabledReason}</p> : null}</div></div></> : <CallList calls={item.calls} />}</section>

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5"><h2 className="text-heading-3 font-semibold">Cuórum requerido</h2>{item.quorum.available ? <div className="mt-3 space-y-2"><p>{item.quorum.quorumType === 'PERCENTAGE' ? `${item.quorum.quorumValue}%` : `${item.quorum.quorumValue} personas`} · se requieren {item.quorum.requiredCount} de {item.quorum.convokedCount} personas convocadas.</p><Badge variant={item.status === 'SCHEDULED' ? 'neutral' : item.quorum.quorumReached ? 'success' : 'warning'}>{item.status === 'SCHEDULED' ? 'Pendiente de asistencia' : item.quorum.quorumReached ? 'Cuórum alcanzado' : 'Cuórum no alcanzado'}</Badge></div> : <div className="mt-3"><p className="text-foreground-muted">Cuórum no disponible</p>{item.quorum.reason ? <p className="mt-1 text-body-small text-foreground-muted">{item.quorum.reason}</p> : null}</div>}</section>

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5"><h2 className="text-heading-3 font-semibold">Asistencia</h2>{item.status === 'SCHEDULED' ? <p className="mt-3 text-foreground-muted">La asistencia se habilita al iniciar la asamblea.</p> : <><div className="mt-3 grid gap-2 text-body-small sm:grid-cols-3"><p>Convocadas: {item.quorum.convokedCount}</p><p>Presentes: {item.attendance.present}</p><p>Por registrar: {item.attendance.unrecorded}</p></div><p className="mt-3 text-body-small text-foreground-muted" aria-live="polite">{item.attendance.data.length - item.attendance.unrecorded} de {item.attendance.data.length} asistencias registradas</p><div className="mt-4 space-y-2">{item.attendance.data.map((person) => <div key={person.id} className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[1fr_auto] md:items-center"><div><p className="font-medium">{person.affiliate.fullName}</p><p className="text-body-small text-foreground-muted">{person.roleNameSnapshot}</p></div>{item.status === 'IN_PROGRESS' && canRecordAttendance ? <div className="flex flex-col gap-2 sm:flex-row" role="group" aria-label={`Asistencia de ${person.affiliate.fullName}`}><Button size="sm" variant={person.attendance?.status === 'PRESENT' ? 'primary' : 'outline'} aria-pressed={person.attendance?.status === 'PRESENT'} type="button" onClick={() => setAttendance(person.affiliateId, 'PRESENT')}>Presente</Button><Button size="sm" variant={person.attendance?.status === 'ABSENT' || person.attendance?.status === 'JUSTIFIED' ? 'accent' : 'outline'} aria-pressed={person.attendance?.status === 'ABSENT'} type="button" onClick={() => setAttendance(person.affiliateId, 'ABSENT')}>Ausente</Button></div> : <Badge variant={person.attendance?.status === 'PRESENT' ? 'success' : person.attendance?.status === 'ABSENT' || person.attendance?.status === 'JUSTIFIED' ? 'warning' : 'neutral'}>{person.attendance?.status === 'PRESENT' ? 'Presente' : person.attendance?.status === 'JUSTIFIED' ? 'Ausencia justificada' : person.attendance?.status === 'ABSENT' ? 'Ausente' : 'Sin registrar'}</Badge>}</div>)}</div>{item.status === 'IN_PROGRESS' && canRunSession ? <div className="mt-4"><Button loading={mutations.complete.isPending} disabled={item.attendance.unrecorded > 0} type="button" onClick={() => completeAssembly(item.id)}>Finalizar asamblea</Button>{item.attendance.unrecorded > 0 ? <p className="mt-1 text-caption text-foreground-muted">Registre las {item.attendance.unrecorded} asistencias pendientes antes de finalizar.</p> : null}</div> : null}</>}</section>
    </div> : null}

    {canCreateAssembly ? <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}><DialogContent><DialogHeader><DialogTitle>¿Desea eliminar esta asamblea?</DialogTitle><DialogDescription>Esta acción eliminará también su lista de personas convocadas y no se puede deshacer.</DialogDescription></DialogHeader><DialogFooter><DialogClose className="min-h-11 rounded-md border border-border px-4">Cancelar</DialogClose><Button loading={mutations.remove.isPending} variant="danger" type="button" onClick={() => void remove()}>Eliminar asamblea</Button></DialogFooter></DialogContent></Dialog> : null}
  </section>
}

function CallRoundEditor({ call, index, onChange, onRemove }: { call: AssemblyCallPayload; index: number; onChange: (call: AssemblyCallPayload) => void; onRemove: () => void }) {
  return <fieldset className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2 xl:grid-cols-[minmax(8rem,.6fr)_minmax(13rem,1fr)_minmax(10rem,.8fr)_minmax(8rem,.6fr)_auto] xl:items-end"><legend className="px-1 text-label font-semibold">Ronda {index + 1}</legend><label className="grid gap-1 text-body-small font-medium">Número<Input aria-label={`Número de ronda ${index + 1}`} type="number" min="1" value={call.callNumber} onChange={(event) => onChange({ ...call, callNumber: Number(event.target.value) })} /></label><label className="grid gap-1 text-body-small font-medium">Fecha y hora<Input aria-label={`Fecha de ronda ${index + 1}`} type="datetime-local" value={call.scheduledAt} onChange={(event) => onChange({ ...call, scheduledAt: event.target.value })} /></label><label className="grid gap-1 text-body-small font-medium">Cuórum<select aria-label={`Modalidad de cuórum de ronda ${index + 1}`} className="h-(--size-control) rounded-control border border-border bg-control px-(--spacing-control-x) text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" value={call.quorumType} onChange={(event) => onChange({ ...call, quorumType: event.target.value as AssemblyQuorumType })}><option value="FIXED">Cantidad fija</option><option value="PERCENTAGE">Porcentaje</option></select></label><label className="grid gap-1 text-body-small font-medium">Valor<Input aria-label={`Valor de cuórum de ronda ${index + 1}`} type="number" min="1" max={call.quorumType === 'PERCENTAGE' ? 100 : undefined} value={call.quorumValue} onChange={(event) => onChange({ ...call, quorumValue: Number(event.target.value) })} /></label><Button variant="ghost" className="text-destructive hover:text-destructive" type="button" onClick={onRemove}>Quitar</Button></fieldset>
}

function ConvocationList({ item }: { item: AssemblyDetail }) {
  return <ul className="mt-3 space-y-2">{item.convocations.length ? item.convocations.map((person) => <li key={person.id} className="rounded-md border border-border p-3"><span className="font-medium">{person.affiliate.fullName}</span><span className="text-body-small text-foreground-muted"> · Rol al momento de la convocatoria: {person.roleNameSnapshot}</span></li>) : <li className="text-foreground-muted">No hay personas convocadas.</li>}</ul>
}

function CallList({ calls }: { calls: AssemblyDetail['calls'] }) {
  return <ul className="mt-3 space-y-2">{calls.length ? calls.map((call) => <li key={call.id} className="rounded-md border border-border p-3"><span className="font-medium">Ronda {call.callNumber}</span><span className="text-body-small text-foreground-muted"> · {dateLabel(call.scheduledAt)} · {call.quorumType === 'PERCENTAGE' ? `${call.quorumValue}%` : `${call.quorumValue} personas`}</span></li>) : <li className="text-foreground-muted">No hay rondas configuradas.</li>}</ul>
}
