import { useEffect, useMemo, useState } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { useToast } from '@/shared/ui/Toast'
import { useAssemblies, useAssembly, useAssemblyMutations, useEligibleAffiliates } from '../hooks/useAssembliesQueries'
import type { AssemblyPayload, AssemblyQuorumType } from '../model/assemblies.types'

const initial: AssemblyPayload = { title: '', date: '', place: '', description: '', quorumType: 'FIXED', quorumValue: 1 }
const dateLabel = (value: string) => new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const statusLabel = (value: string) => value === 'SCHEDULED' ? 'Programada' : value === 'IN_PROGRESS' ? 'En curso' : value === 'COMPLETED' ? 'Finalizada' : 'Cancelada'

export function AssembliesAdminPage() {
  const list = useAssemblies()
  const mutations = useAssemblyMutations()
  const { notify } = useToast()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const detail = useAssembly(selectedId)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedPeople, setSelectedPeople] = useState<number[]>([])
  const eligible = useEligibleAffiliates(selectedId !== null)
  useEffect(() => { if (detail.data) setSelectedPeople(detail.data.convocations.map((item) => item.affiliateId)) }, [detail.data])
  const people = useMemo(() => (eligible.data ?? []).filter((item) => item.fullName.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))), [eligible.data, search])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('')
    if (!form.title.trim() || !form.date || !form.place.trim()) return setError('Complete el título, la fecha y el lugar.')
    if (!Number.isInteger(form.quorumValue) || form.quorumValue <= 0 || (form.quorumType === 'PERCENTAGE' && form.quorumValue > 100)) return setError(form.quorumType === 'PERCENTAGE' ? 'El porcentaje debe ser un entero entre 1 y 100.' : 'La cantidad fija debe ser un entero mayor que cero.')
    try {
      const payload = { ...form, title: form.title.trim(), place: form.place.trim(), date: new Date(form.date).toISOString() }
      const saved = editingId ? await mutations.update.mutateAsync({ id: editingId, payload }) : await mutations.create.mutateAsync(payload)
      setCreating(false); setEditingId(null); setForm(initial); setSelectedId(saved.id)
    } catch (reason) { setError(getErrorMessage(reason, 'No fue posible guardar la asamblea.')) }
  }

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setError('')
    try { await action() } catch (reason) { setError(getErrorMessage(reason, fallback)) }
  }

  const remove = async () => {
    if (!selectedId) return
    await run(async () => { await mutations.remove.mutateAsync(selectedId); setDeleteOpen(false); setSelectedId(null); notify('La asamblea fue eliminada.', 'success') }, 'No fue posible eliminar la asamblea porque contiene información histórica.')
  }

  const setAttendance = (affiliateId: number, status: 'PRESENT' | 'ABSENT') => {
    if (!selectedId) return
    void run(() => mutations.attendance.mutateAsync({ id: selectedId, entries: [{ affiliateId, status }] }), 'No fue posible actualizar la asistencia.')
  }

  const item = detail.data
  return <section className="space-y-6">
    <PageHeader context="Gestión administrativa" title={item ? item.title : 'Asambleas'} description={item ? `${dateLabel(item.date)} · ${item.place}` : 'Organice asambleas, personas convocadas, asistencia y cuórum.'} actions={item ? <button className="min-h-11 rounded-md border border-border px-4 font-semibold" type="button" onClick={() => setSelectedId(null)}>Volver al listado</button> : <button className="min-h-11 rounded-md bg-brand-deep px-4 font-semibold text-brand-ivory" type="button" onClick={() => { setEditingId(null); setForm(initial); setCreating((value) => !value) }}>{creating ? 'Cerrar formulario' : 'Crear asamblea'}</button>} />
    {error ? <p role="alert" className="rounded-md border border-danger p-3 text-danger">{error}</p> : null}
    {creating ? <form className="grid gap-4 rounded-xl border border-border bg-surface p-5 md:grid-cols-2" onSubmit={submit} noValidate>
      <label className="grid gap-1 font-medium">Título o motivo<input className="min-h-11 rounded-md border border-border px-3" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
      <label className="grid gap-1 font-medium">Fecha y hora<input type="datetime-local" className="min-h-11 rounded-md border border-border px-3" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
      <label className="grid gap-1 font-medium">Lugar<input className="min-h-11 rounded-md border border-border px-3" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} /></label>
      <label className="grid gap-1 font-medium">Modalidad del cuórum<select className="min-h-11 rounded-md border border-border px-3" value={form.quorumType} onChange={(e) => setForm({ ...form, quorumType: e.target.value as AssemblyQuorumType })}><option value="FIXED">Cantidad fija</option><option value="PERCENTAGE">Porcentaje</option></select></label>
      <label className="grid gap-1 font-medium">{form.quorumType === 'FIXED' ? 'Cantidad mínima de personas' : 'Porcentaje mínimo'}<input type="number" min="1" max={form.quorumType === 'PERCENTAGE' ? 100 : undefined} step="1" className="min-h-11 rounded-md border border-border px-3" value={form.quorumValue} onChange={(e) => setForm({ ...form, quorumValue: Number(e.target.value) })} /></label>
      <label className="grid gap-1 font-medium md:col-span-2">Descripción<textarea className="min-h-24 rounded-md border border-border p-3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
      <button disabled={mutations.create.isPending || mutations.update.isPending} className="min-h-11 rounded-md bg-brand-deep px-4 font-semibold text-brand-ivory disabled:opacity-60" type="submit">{mutations.create.isPending || mutations.update.isPending ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear y continuar'}</button>
    </form> : null}
    {!selectedId && list.isPending ? <LoadingState label="Cargando asambleas..." /> : null}
    {!selectedId && list.isError ? <ErrorState message={getErrorMessage(list.error, 'No fue posible cargar las asambleas.')} /> : null}
    {!selectedId && list.data?.length === 0 ? <EmptyState title="No hay asambleas registradas" description="Cree la primera asamblea cuando tenga confirmados sus datos." /> : null}
    {!selectedId && list.data?.length ? <div className="grid gap-3">{list.data.map((assembly) => <article key={assembly.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-brand-ink">{assembly.title}</h2><p className="text-body-small text-foreground-muted">{dateLabel(assembly.date)} · {statusLabel(assembly.status)}</p><p className="text-body-small">Cuórum: {assembly.quorumType === 'FIXED' ? `${assembly.quorumValue} personas` : assembly.quorumType === 'PERCENTAGE' ? `${assembly.quorumValue}%` : 'Sin configuración histórica'}</p></div><button className="min-h-11 rounded-md border border-border px-4 font-semibold" type="button" onClick={() => setSelectedId(assembly.id)}>Ver y gestionar</button></article>)}</div> : null}
    {selectedId && detail.isPending ? <LoadingState label="Cargando detalle..." /> : null}
    {item ? <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-heading-3 font-semibold">Información de la Asamblea</h2><p>Estado: {statusLabel(item.status)}</p></div>{item.status === 'SCHEDULED' ? <div className="flex flex-wrap gap-2"><button type="button" className="min-h-11 rounded-md border border-border px-4" onClick={() => { setEditingId(item.id); setForm({ title: item.title, type: item.type ?? undefined, date: item.date.slice(0, 16), place: item.place, description: item.description ?? '', quorumType: item.quorumType ?? 'FIXED', quorumValue: item.quorumValue ?? 1 }); setCreating(true) }}>Editar datos</button><button type="button" className="min-h-11 rounded-md border border-danger px-4 text-danger" onClick={() => setDeleteOpen(true)}>Eliminar asamblea</button></div> : null}</div></section>
      <section className="rounded-xl border border-border bg-surface p-5"><h2 className="text-heading-3 font-semibold">Personas convocadas</h2>{item.status === 'SCHEDULED' ? <><label className="mt-3 grid gap-1 font-medium">Buscar persona<input className="min-h-11 rounded-md border border-border px-3" value={search} onChange={(e) => setSearch(e.target.value)} /></label><div className="mt-3 max-h-72 space-y-2 overflow-y-auto">{people.map((person) => <label key={person.id} className="flex min-h-11 items-center gap-3 rounded-md border border-border p-3"><input type="checkbox" checked={selectedPeople.includes(person.id)} onChange={() => setSelectedPeople((current) => current.includes(person.id) ? current.filter((id) => id !== person.id) : [...current, person.id])} /><span>{person.fullName}<small className="block text-foreground-muted">Rol actual: {person.role.name}</small></span></label>)}</div><div className="mt-3 flex flex-wrap gap-2"><button disabled={mutations.convocations.isPending} type="button" className="min-h-11 rounded-md bg-brand-deep px-4 font-semibold text-brand-ivory" onClick={() => void run(() => mutations.convocations.mutateAsync({ id: item.id, affiliateIds: selectedPeople }), 'No fue posible guardar las personas convocadas.')}>Guardar {selectedPeople.length} personas convocadas</button><button disabled={selectedPeople.length === 0 || mutations.start.isPending} type="button" className="min-h-11 rounded-md border border-warning px-4 font-semibold" onClick={() => void run(() => mutations.start.mutateAsync(item.id), 'No fue posible iniciar la asamblea.')}>Iniciar asamblea</button></div></> : <ul className="mt-3 space-y-2">{item.convocations.map((person) => <li key={person.id}>{person.affiliate.fullName} — Rol al momento de la convocatoria: {person.roleNameSnapshot}</li>)}</ul>}</section>
      <section className="rounded-xl border border-border bg-surface p-5"><h2 className="text-heading-3 font-semibold">Cuórum requerido</h2>{item.quorum.available ? <><p>{item.quorum.quorumType === 'PERCENTAGE' ? `${item.quorum.quorumValue}%` : `${item.quorum.quorumValue} personas`} ({item.quorum.requiredCount} de {item.quorum.convokedCount} personas)</p><p className="mt-2 font-semibold">{item.status === 'SCHEDULED' ? 'Pendiente de asistencia.' : item.quorum.quorumReached ? 'Cuórum alcanzado' : 'Cuórum no alcanzado'}</p></> : <p>Cuórum no disponible para esta asamblea histórica.</p>}</section>
      <section className="rounded-xl border border-border bg-surface p-5"><h2 className="text-heading-3 font-semibold">Asistencia</h2>{item.status === 'SCHEDULED' ? <p className="mt-2">Podrá registrar la asistencia cuando dé inicio a la asamblea.</p> : <><p className="mt-2">{item.attendance.data.length - item.attendance.unrecorded} de {item.attendance.data.length} asistencias registradas</p><div className="mt-4 space-y-3">{item.attendance.data.map((person) => <div key={person.id} className="grid gap-3 rounded-md border border-border p-3 md:grid-cols-[1fr_auto] md:items-center"><div><p className="font-medium">{person.affiliate.fullName}</p><p className="text-body-small text-foreground-muted">{person.roleNameSnapshot}</p></div>{item.status === 'IN_PROGRESS' ? <div className="flex gap-2" role="group" aria-label={`Asistencia de ${person.affiliate.fullName}`}><button type="button" aria-pressed={person.attendance?.status === 'PRESENT'} className={`min-h-11 rounded-md border px-4 ${person.attendance?.status === 'PRESENT' ? 'bg-success text-white' : 'border-border'}`} onClick={() => setAttendance(person.affiliateId, 'PRESENT')}>Presente</button><button type="button" aria-pressed={person.attendance?.status === 'ABSENT'} className={`min-h-11 rounded-md border px-4 ${person.attendance?.status === 'ABSENT' || person.attendance?.status === 'JUSTIFIED' ? 'bg-warning' : 'border-border'}`} onClick={() => setAttendance(person.affiliateId, 'ABSENT')}>Ausente</button></div> : <p className="font-semibold">{person.attendance?.status === 'PRESENT' ? 'Presente' : 'Ausente'}</p>}</div>)}</div>{item.status === 'IN_PROGRESS' ? <button disabled={item.attendance.unrecorded > 0 || mutations.complete.isPending} type="button" className="mt-4 min-h-11 rounded-md bg-brand-deep px-4 font-semibold text-brand-ivory disabled:opacity-60" onClick={() => void run(() => mutations.complete.mutateAsync(item.id), 'No se puede finalizar mientras falten asistencias por registrar.')}>Finalizar asamblea</button> : null}<div className="mt-4 grid gap-2 sm:grid-cols-3"><p>Convocados: {item.quorum.convokedCount}</p><p>Presentes: {item.attendance.present}</p><p>Ausentes: {item.attendance.absent + item.attendance.justified}</p></div></>}</section>
    </div> : null}
    <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}><DialogContent><DialogHeader><DialogTitle>¿Desea eliminar esta asamblea?</DialogTitle><DialogDescription>Esta acción eliminará también su lista de personas convocadas y no se puede deshacer.</DialogDescription></DialogHeader><DialogFooter><DialogClose className="min-h-11 rounded-md border border-border px-4">Cancelar</DialogClose><button disabled={mutations.remove.isPending} type="button" className="min-h-11 rounded-md bg-danger px-4 font-semibold text-white" onClick={() => void remove()}>{mutations.remove.isPending ? 'Eliminando…' : 'Eliminar asamblea'}</button></DialogFooter></DialogContent></Dialog>
  </section>
}
