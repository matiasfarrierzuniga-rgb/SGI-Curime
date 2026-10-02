import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/shared/lib/errors'
import { useAuth } from '@/features/auth'
import { hasCapability } from '@/shared/security/access'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { useToast } from '@/shared/ui/Toast'
import { useAssemblies, useAssembly, useAssemblyMutations, useEligibleAffiliates } from '../hooks/useAssembliesQueries'
import type { AssemblyDetail, AssemblyPayload, AssemblyQuorumType, AssemblyStatus, AttendanceStatus } from '../model/assemblies.types'

const initial: AssemblyPayload = { title: '', date: '', place: '', description: '', quorumType: 'FIXED', quorumValue: 1 }
const dateLabel = (value: string) => new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const statusLabel = (value: AssemblyStatus) => value === 'SCHEDULED' ? 'Programada' : value === 'IN_PROGRESS' ? 'En curso' : value === 'COMPLETED' ? 'Finalizada' : 'Cancelada'

export function AssembliesAdminPage({ assemblyId }: { assemblyId?: number } = {}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const canManage = hasCapability(user?.permissionCodes, 'adm.assemblies.manage')
  const activeId = assemblyId ?? null
  const list = useAssemblies()
  const detail = useAssembly(activeId)
  const eligible = useEligibleAffiliates(activeId !== null)
  const mutations = useAssemblyMutations()
  const { notify } = useToast()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const [attendanceFeedback, setAttendanceFeedback] = useState('')
  const [search, setSearch] = useState('')
  const [selectedPeople, setSelectedPeople] = useState<number[]>([])

  useEffect(() => { if (detail.data) setSelectedPeople(detail.data.convocations.map((person) => person.affiliateId)) }, [detail.data])
  const people = useMemo(() => (eligible.data ?? []).filter((person) => person.fullName.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))), [eligible.data, search])
  const item = detail.data

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setError('')
    try { await action() } catch (reason) { setError(getErrorMessage(reason, fallback)) }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canManage) return
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
    if (!canManage || !activeId) return
    await run(async () => { await mutations.remove.mutateAsync(activeId); setDeleteOpen(false); navigate('/app/admin/assemblies'); notify('La asamblea fue eliminada.', 'success') }, 'No fue posible eliminar la asamblea porque contiene información histórica.')
  }
  const saveConvocations = (id: number) => { if (canManage) void run(async () => { await mutations.convocations.mutateAsync({ id, affiliateIds: selectedPeople }); notify('Personas convocadas guardadas correctamente.', 'success') }, 'No fue posible guardar las personas convocadas.') }
  const startAssembly = (id: number) => { if (canManage) void run(async () => { await mutations.start.mutateAsync(id); notify('Asamblea iniciada correctamente.', 'success') }, 'No fue posible iniciar la asamblea.') }
  const setAttendance = (affiliateId: number, status: Extract<AttendanceStatus, 'PRESENT' | 'ABSENT'>) => { if (canManage && activeId) void run(async () => { await mutations.attendance.mutateAsync({ id: activeId, entries: [{ affiliateId, status }] }); setAttendanceFeedback('Asistencia actualizada.') }, 'No fue posible actualizar la asistencia.') }
  const completeAssembly = (id: number) => { if (canManage) void run(async () => { await mutations.complete.mutateAsync(id); notify('Asamblea finalizada correctamente.', 'success') }, 'No se puede finalizar mientras falten asistencias por registrar.') }

  return <section className="space-y-6">
    {!canManage ? <p className="rounded-md border border-border bg-surface-muted p-3 text-sm text-foreground-muted">Tiene acceso de consulta. Gestionar asambleas requiere permiso de administración.</p> : null}
    <PageHeader context="Gestión administrativa" title={item ? item.title : 'Asambleas'} description={item ? `${dateLabel(item.date)} · ${item.place}` : 'Organice asambleas, personas convocadas, asistencia y cuórum.'} actions={item ? <button className="min-h-11 rounded-md border border-border px-4 font-semibold" type="button" onClick={() => navigate('/app/admin/assemblies')}>Volver al listado</button> : canManage ? <button className="min-h-11 rounded-md bg-brand-deep px-4 font-semibold text-brand-ivory" type="button" onClick={() => { setEditingId(null); setForm(initial); setCreating((value) => !value) }}>{creating ? 'Cerrar formulario' : 'Crear asamblea'}</button> : undefined} />
    {error ? <p role="alert" className="rounded-md border border-danger p-3 text-danger">{error}</p> : null}
    {attendanceFeedback ? <p role="status" className="rounded-md border border-success p-3 text-success">{attendanceFeedback}</p> : null}
    {creating ? <form className="grid gap-4 rounded-xl border border-border bg-surface p-5 md:grid-cols-2" onSubmit={submit} noValidate>
      <label className="grid gap-1 font-medium">Título o motivo<input className="min-h-11 rounded-md border border-border px-3" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
      <label className="grid gap-1 font-medium">Fecha y hora<input type="datetime-local" className="min-h-11 rounded-md border border-border px-3" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
      <label className="grid gap-1 font-medium">Lugar<input className="min-h-11 rounded-md border border-border px-3" value={form.place} onChange={(event) => setForm({ ...form, place: event.target.value })} /></label>
      <label className="grid gap-1 font-medium">Modalidad del cuórum<select className="min-h-11 rounded-md border border-border px-3" value={form.quorumType} onChange={(event) => setForm({ ...form, quorumType: event.target.value as AssemblyQuorumType })}><option value="FIXED">Cantidad fija</option><option value="PERCENTAGE">Porcentaje</option></select></label>
      <label className="grid gap-1 font-medium">{form.quorumType === 'FIXED' ? 'Cantidad mínima de personas' : 'Porcentaje mínimo'}<input type="number" min="1" max={form.quorumType === 'PERCENTAGE' ? 100 : undefined} step="1" className="min-h-11 rounded-md border border-border px-3" value={form.quorumValue} onChange={(event) => setForm({ ...form, quorumValue: Number(event.target.value) })} /></label>
      <label className="grid gap-1 font-medium md:col-span-2">Descripción<textarea className="min-h-24 rounded-md border border-border p-3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
      <button disabled={mutations.create.isPending || mutations.update.isPending} className="min-h-11 rounded-md bg-brand-deep px-4 font-semibold text-brand-ivory disabled:opacity-60" type="submit">{mutations.create.isPending || mutations.update.isPending ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear y continuar'}</button>
    </form> : null}
    {!activeId && list.isPending ? <LoadingState label="Cargando asambleas..." /> : null}
    {!activeId && list.isError ? <ErrorState message={getErrorMessage(list.error, 'No fue posible cargar las asambleas.')} /> : null}
    {!activeId && list.data?.length === 0 ? <EmptyState title="No hay asambleas registradas" description="Cree la primera asamblea cuando tenga confirmados sus datos." /> : null}
    {!activeId && list.data?.length ? <div className="grid gap-3">{list.data.map((assembly) => <article key={assembly.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-brand-ink">{assembly.title}</h2><p className="text-body-small text-foreground-muted">{dateLabel(assembly.date)} · {statusLabel(assembly.status)}</p><p className="text-body-small">Cuórum: {assembly.quorumType === 'FIXED' ? `${assembly.quorumValue} personas` : assembly.quorumType === 'PERCENTAGE' ? `${assembly.quorumValue}%` : 'Sin configuración histórica'}</p></div><button className="min-h-11 rounded-md border border-border px-4 font-semibold" type="button" onClick={() => navigate(`/app/admin/assemblies/${assembly.id}`)}>Ver y gestionar</button></article>)}</div> : null}
    {activeId && detail.isPending ? <LoadingState label="Cargando detalle..." /> : null}
    {activeId && detail.isError ? <ErrorState message={getErrorMessage(detail.error, 'No fue posible cargar el detalle de la asamblea.')} /> : null}
    {item ? <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-heading-3 font-semibold">Información de la Asamblea</h2><p>Estado: {statusLabel(item.status)}</p></div>{item.status === 'SCHEDULED' && canManage ? <div className="flex flex-wrap gap-2"><button type="button" className="min-h-11 rounded-md border border-border px-4" onClick={() => { setEditingId(item.id); setForm({ title: item.title, type: item.type ?? undefined, date: item.date.slice(0, 16), place: item.place, description: item.description ?? '', quorumType: item.quorumType ?? 'FIXED', quorumValue: item.quorumValue ?? 1 }); setCreating(true) }}>Editar datos</button><button type="button" className="min-h-11 rounded-md border border-danger px-4 text-danger" onClick={() => setDeleteOpen(true)}>Eliminar asamblea</button></div> : null}</div></section>
      <section className="rounded-xl border border-border bg-surface p-5"><h2 className="text-heading-3 font-semibold">Personas convocadas</h2>{item.status === 'SCHEDULED' && canManage ? <><label className="mt-3 grid gap-1 font-medium">Buscar persona<input className="min-h-11 rounded-md border border-border px-3" value={search} onChange={(event) => setSearch(event.target.value)} /></label><div className="mt-3 max-h-72 space-y-2 overflow-y-auto">{people.map((person) => <label key={person.id} className="flex min-h-11 items-center gap-3 rounded-md border border-border p-3"><input type="checkbox" checked={selectedPeople.includes(person.id)} onChange={() => setSelectedPeople((current) => current.includes(person.id) ? current.filter((id) => id !== person.id) : [...current, person.id])} /><span>{person.fullName}</span></label>)}</div><div className="mt-3 flex flex-wrap gap-2"><button disabled={mutations.convocations.isPending} type="button" className="min-h-11 rounded-md bg-brand-deep px-4 font-semibold text-brand-ivory" onClick={() => saveConvocations(item.id)}>Guardar {selectedPeople.length} personas convocadas</button><button disabled={selectedPeople.length === 0 || mutations.start.isPending} type="button" className="min-h-11 rounded-md border border-warning px-4 font-semibold" onClick={() => startAssembly(item.id)}>Iniciar asamblea</button></div></> : <ConvocationList item={item} />}</section>
      <section className="rounded-xl border border-border bg-surface p-5"><h2 className="text-heading-3 font-semibold">Cuórum requerido</h2>{item.quorum.available ? <><p>{item.quorum.quorumType === 'PERCENTAGE' ? `${item.quorum.quorumValue}%` : `${item.quorum.quorumValue} personas`} ({item.quorum.requiredCount} de {item.quorum.convokedCount} personas)</p><p className="mt-2 font-semibold">{item.status === 'SCHEDULED' ? 'Pendiente de asistencia.' : item.quorum.quorumReached ? 'Cuórum alcanzado' : 'Cuórum no alcanzado'}</p></> : <p>Cuórum no disponible</p>}</section>
      <section className="rounded-xl border border-border bg-surface p-5"><h2 className="text-heading-3 font-semibold">Asistencia</h2>{item.status === 'SCHEDULED' ? <p className="mt-2">Podrá registrar la asistencia cuando dé inicio a la asamblea.</p> : <><p className="mt-2">{item.attendance.data.length - item.attendance.unrecorded} de {item.attendance.data.length} asistencias registradas</p><div className="mt-4 space-y-3">{item.attendance.data.map((person) => <div key={person.id} className="grid gap-3 rounded-md border border-border p-3 md:grid-cols-[1fr_auto] md:items-center"><div><p className="font-medium">{person.affiliate.fullName}</p><p className="text-body-small text-foreground-muted">{person.roleNameSnapshot}</p></div>{item.status === 'IN_PROGRESS' && canManage ? <div className="flex gap-2" role="group" aria-label={`Asistencia de ${person.affiliate.fullName}`}><button type="button" aria-pressed={person.attendance?.status === 'PRESENT'} className={`min-h-11 rounded-md border px-4 ${person.attendance?.status === 'PRESENT' ? 'bg-success text-white' : 'border-border'}`} onClick={() => setAttendance(person.affiliateId, 'PRESENT')}>Presente</button><button type="button" aria-pressed={person.attendance?.status === 'ABSENT'} className={`min-h-11 rounded-md border px-4 ${person.attendance?.status === 'ABSENT' || person.attendance?.status === 'JUSTIFIED' ? 'bg-warning' : 'border-border'}`} onClick={() => setAttendance(person.affiliateId, 'ABSENT')}>Ausente</button></div> : <p className="font-semibold">{person.attendance?.status === 'PRESENT' ? 'Presente' : person.attendance?.status === 'JUSTIFIED' ? 'Ausencia justificada' : person.attendance?.status === 'ABSENT' ? 'Ausente' : 'Sin registrar'}</p>}</div>)}</div>{item.status === 'IN_PROGRESS' && canManage ? <button disabled={item.attendance.unrecorded > 0 || mutations.complete.isPending} type="button" className="mt-4 min-h-11 rounded-md bg-brand-deep px-4 font-semibold text-brand-ivory disabled:opacity-60" onClick={() => completeAssembly(item.id)}>Finalizar asamblea</button> : null}<div className="mt-4 grid gap-2 sm:grid-cols-3"><p>Convocados: {item.quorum.convokedCount}</p><p>Presentes: {item.attendance.present}</p><p>Ausentes: {item.attendance.absent + item.attendance.justified}</p></div></>}</section>
    </div> : null}
    {canManage ? <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}><DialogContent><DialogHeader><DialogTitle>¿Desea eliminar esta asamblea?</DialogTitle><DialogDescription>Esta acción eliminará también su lista de personas convocadas y no se puede deshacer.</DialogDescription></DialogHeader><DialogFooter><DialogClose className="min-h-11 rounded-md border border-border px-4">Cancelar</DialogClose><button disabled={mutations.remove.isPending} type="button" className="min-h-11 rounded-md bg-danger px-4 font-semibold text-white" onClick={() => void remove()}>{mutations.remove.isPending ? 'Eliminando…' : 'Eliminar asamblea'}</button></DialogFooter></DialogContent></Dialog> : null}
  </section>
}

function ConvocationList({ item }: { item: AssemblyDetail }) {
  return <ul className="mt-3 space-y-2">{item.convocations.length ? item.convocations.map((person) => <li key={person.id}>{person.affiliate.fullName} — Rol al momento de la convocatoria: {person.roleNameSnapshot}</li>) : <li className="text-foreground-muted">No hay personas convocadas.</li>}</ul>
}
