import { useState, type FormEvent } from 'react'
import { CalendarDays, Pencil, Plus, UsersRound } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { getErrorMessage } from '@/shared/lib/errors'
import { hasCapability } from '@/shared/security/access'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Input } from '@/shared/ui/input'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Select } from '@/shared/ui/select'
import { useBoardMutations, useBoardTerms, usePersonCandidates } from '../hooks/institutionalBoard.queries'
import { BOARD_POSITIONS, BOARD_POSITION_LABELS, type BoardAppointment, type BoardPosition } from '../model/institutionalBoard.types'

const emptyAppointment = { personId: 0, position: 'PRESIDENT' as BoardPosition, seatNumber: '', startsOn: '', endsOn: '' }
const emptyTerm = { startsOn: '', endsOn: '' }
const dateOnly = (value: string | null) => value ? value.slice(0, 10) : 'No especificada'
const personName = (appointment: BoardAppointment) => [appointment.person.firstName, appointment.person.firstSurname, appointment.person.secondSurname].filter(Boolean).join(' ') || appointment.person.legacyFullName || `Persona ${appointment.personId}`

export function InstitutionalBoardPage() {
  const terms = useBoardTerms()
  const mutations = useBoardMutations()
  const { user } = useAuth()
  const canManage = hasCapability(user?.permissionCodes, 'adm.institutional-board.manage')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selected = terms.data?.find(term => term.id === selectedId) ?? terms.data?.[0]
  const [term, setTerm] = useState(emptyTerm)
  const [termFormOpen, setTermFormOpen] = useState(false)
  const [editingTerm, setEditingTerm] = useState(false)
  const [appointment, setAppointment] = useState(emptyAppointment)
  const [editing, setEditing] = useState<BoardAppointment | null>(null)
  const [query, setQuery] = useState('')
  const candidates = usePersonCandidates(query)
  const [message, setMessage] = useState('')

  const submitTerm = async (event: FormEvent) => {
    event.preventDefault()
    if (!canManage) return
    setMessage('')
    try {
      await mutations.createTerm.mutateAsync(term)
      setTerm(emptyTerm)
      setTermFormOpen(false)
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const updateSelectedTerm = async (event: FormEvent) => {
    event.preventDefault()
    if (!selected || !canManage) return
    setMessage('')
    try {
      await mutations.updateTerm.mutateAsync({
        id: selected.id,
        input: { startsOn: term.startsOn || undefined, endsOn: term.endsOn || undefined },
      })
      setTerm(emptyTerm)
      setEditingTerm(false)
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const submitAppointment = async (event: FormEvent) => {
    event.preventDefault()
    if (!canManage || !selected || (!editing && !appointment.personId)) return
    setMessage('')
    const commonInput = {
      position: appointment.position,
      seatNumber: appointment.seatNumber ? Number(appointment.seatNumber) : null,
      startsOn: appointment.startsOn || null,
      endsOn: appointment.endsOn || null,
    }
    try {
      if (editing) await mutations.updateAppointment.mutateAsync({ id: editing.id, input: commonInput })
      else await mutations.createAppointment.mutateAsync({ termId: selected.id, input: { personId: appointment.personId, ...commonInput } })
      setAppointment(emptyAppointment)
      setEditing(null)
      setQuery('')
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const edit = (item: BoardAppointment) => {
    setEditing(item)
    setQuery('')
    setAppointment({
      personId: item.personId,
      position: item.position,
      seatNumber: item.seatNumber?.toString() ?? '',
      startsOn: item.startsOn?.slice(0, 10) ?? '',
      endsOn: item.endsOn?.slice(0, 10) ?? '',
    })
  }

  const beginTermEdit = () => {
    if (!selected) return
    setMessage('')
    setTermFormOpen(false)
    setEditingTerm(true)
    setTerm({ startsOn: dateOnly(selected.startsOn), endsOn: dateOnly(selected.endsOn) })
  }

  const cancelTermForm = () => {
    setTerm(emptyTerm)
    setTermFormOpen(false)
    setEditingTerm(false)
  }

  return <section className="space-y-6">
    <PageHeader
      context="Gestión administrativa"
      title="Junta Directiva"
      description="Consulte períodos y nombramientos registrados."
      actions={canManage ? <Button type="button" onClick={() => { setMessage(''); setEditingTerm(false); setTerm(emptyTerm); setTermFormOpen(value => !value) }}><Plus aria-hidden="true" /> {termFormOpen ? 'Cerrar formulario' : 'Nuevo período'}</Button> : undefined}
    />
    <div className="border-l-4 border-brand-accent bg-surface-subtle px-4 py-3 text-body-small text-text-secondary">
      Registre únicamente información institucional confirmada.
    </div>
    {message ? <ErrorState title="No fue posible guardar" message={message} /> : null}
    {!canManage ? <p className="rounded-control border border-border-default bg-surface-subtle p-3 text-body-small text-text-secondary">Tiene acceso de consulta. Las modificaciones requieren permiso de administración.</p> : null}

    {canManage && termFormOpen ? <Card className="border-brand-soft/60">
      <CardHeader><CardTitle>Nuevo período</CardTitle><CardDescription>Indique las fechas de inicio y finalización registradas.</CardDescription></CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]" onSubmit={submitTerm}>
          <label className="grid gap-2 text-sm font-semibold">Desde<Input type="date" required value={term.startsOn} onChange={event => setTerm({ ...term, startsOn: event.target.value })} /></label>
          <label className="grid gap-2 text-sm font-semibold">Hasta<Input type="date" required value={term.endsOn} onChange={event => setTerm({ ...term, endsOn: event.target.value })} /></label>
          <div className="flex gap-2 self-end"><Button type="submit" disabled={mutations.createTerm.isPending}>{mutations.createTerm.isPending ? 'Guardando…' : 'Crear período'}</Button><Button type="button" variant="outline" onClick={cancelTermForm}>Cancelar</Button></div>
        </form>
      </CardContent>
    </Card> : null}

    {canManage && selected && editingTerm ? <Card className="border-brand-soft/60">
      <CardHeader><CardTitle>Editar período</CardTitle><CardDescription>Modifique las fechas que correspondan al registro.</CardDescription></CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]" onSubmit={updateSelectedTerm}>
          <label className="grid gap-2 text-sm font-semibold">Desde<Input type="date" value={term.startsOn} onChange={event => setTerm({ ...term, startsOn: event.target.value })} /></label>
          <label className="grid gap-2 text-sm font-semibold">Hasta<Input type="date" value={term.endsOn} onChange={event => setTerm({ ...term, endsOn: event.target.value })} /></label>
          <div className="flex gap-2 self-end"><Button type="submit" disabled={mutations.updateTerm.isPending}>{mutations.updateTerm.isPending ? 'Guardando…' : 'Guardar cambios'}</Button><Button type="button" variant="outline" onClick={cancelTermForm}>Cancelar</Button></div>
        </form>
      </CardContent>
    </Card> : null}

    {terms.isPending ? <LoadingState label="Cargando períodos..." /> : null}
    {terms.isError ? <ErrorState title="No fue posible cargar los períodos" message={getErrorMessage(terms.error)} /> : null}
    {terms.data?.length === 0 ? <EmptyState title="No hay períodos registrados" description={canManage ? 'Cree el primer período cuando tenga sus fechas confirmadas.' : 'No existen períodos disponibles para consulta.'} action={canManage ? <Button type="button" onClick={() => setTermFormOpen(true)}><Plus aria-hidden="true" /> Crear período</Button> : undefined} /> : null}

    {terms.data?.length ? <div className="grid gap-6 xl:grid-cols-[19rem_minmax(0,1fr)]">
      <Card className="h-fit xl:sticky xl:top-6">
        <CardHeader><CardTitle>Períodos</CardTitle><CardDescription>Seleccione un período para consultar sus nombramientos.</CardDescription></CardHeader>
        <CardContent><div className="grid gap-2">{terms.data.map(item => <Button key={item.id} type="button" className="h-auto min-h-12 justify-start whitespace-normal py-3 text-left" variant={selected?.id === item.id ? 'default' : 'outline'} onClick={() => { setSelectedId(item.id); setEditingTerm(false); setTerm(emptyTerm) }}><CalendarDays aria-hidden="true" /> <span>{dateOnly(item.startsOn)} <span aria-hidden="true">—</span> {dateOnly(item.endsOn)}</span></Button>)}</div></CardContent>
      </Card>
      <div className="space-y-6">
        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle>Nombramientos</CardTitle><CardDescription className="mt-1">Período del {dateOnly(selected!.startsOn)} al {dateOnly(selected!.endsOn)}.</CardDescription></div>{canManage ? <Button type="button" variant="outline" size="sm" onClick={beginTermEdit}><Pencil aria-hidden="true" /> Editar período</Button> : null}</CardHeader>
          <CardContent>{selected!.appointments.length === 0 ? <EmptyState title="Sin nombramientos" description={canManage ? 'Agregue un nombramiento cuando disponga de la información confirmada.' : 'Este período no tiene nombramientos disponibles.'} /> : <div className="overflow-x-auto rounded-control border border-border-default">
            <table className="min-w-[42rem] w-full text-left text-body-small">
              <thead className="bg-surface-subtle text-text-secondary"><tr><th scope="col" className="p-3 font-semibold">Cargo</th><th scope="col" className="p-3 font-semibold">Persona</th><th scope="col" className="p-3 font-semibold">Plaza</th><th scope="col" className="p-3 font-semibold">Vigencia</th>{canManage ? <th scope="col" className="p-3"><span className="sr-only">Acciones</span></th> : null}</tr></thead>
              <tbody>{selected!.appointments.map(item => <tr key={item.id} className="border-t border-border-default align-top transition-colors hover:bg-surface-subtle/70"><td className="p-3 font-semibold text-text-primary">{BOARD_POSITION_LABELS[item.position]}</td><td className="p-3 text-text-primary">{personName(item)}</td><td className="p-3 text-text-secondary">{item.seatNumber ?? '—'}</td><td className="p-3 whitespace-nowrap text-text-secondary">{dateOnly(item.startsOn)} — {dateOnly(item.endsOn)}</td>{canManage ? <td className="p-3 text-right"><Button type="button" size="sm" variant="outline" onClick={() => edit(item)}><Pencil aria-hidden="true" /> Editar</Button></td> : null}</tr>)}</tbody>
            </table>
          </div>}</CardContent>
        </Card>

        {canManage ? <Card>
          <CardHeader><CardTitle>{editing ? 'Editar nombramiento' : 'Agregar nombramiento'}</CardTitle><CardDescription>{editing ? 'Actualice los datos disponibles para este nombramiento.' : 'Busque y seleccione una persona existente antes de guardar.'}</CardDescription></CardHeader>
          <CardContent><form className="grid gap-4 md:grid-cols-2" onSubmit={submitAppointment}>
            {editing ? <div className="grid gap-2 md:col-span-2"><span className="text-sm font-semibold">Persona</span><p className="rounded-control border border-border-default bg-surface-subtle p-3" aria-label="Persona del nombramiento">{personName(editing)}</p></div> : <>
              <label className="grid gap-2 text-sm font-semibold md:col-span-2">Buscar persona<Input value={query} onChange={event => { setQuery(event.target.value); setAppointment({ ...appointment, personId: 0 }) }} placeholder="Nombre o identificación" aria-describedby="person-help" /><span id="person-help" className="font-normal text-text-secondary">Escriba al menos dos caracteres y seleccione una persona existente.</span></label>
              {query.trim().length >= 2 && candidates.isPending ? <LoadingState className="min-h-11 justify-start md:col-span-2" label="Buscando personas..." /> : null}
              {query.trim().length >= 2 && candidates.isError ? <ErrorState className="md:col-span-2" title="No fue posible buscar personas" message={getErrorMessage(candidates.error)} /> : null}
              {query.trim().length >= 2 && !candidates.isPending && !candidates.isError && candidates.data?.length === 0 ? <p className="md:col-span-2 text-body-small text-text-secondary">No se encontraron personas para esta búsqueda.</p> : null}
              {candidates.data?.length ? <div className="grid gap-2 md:col-span-2" role="group" aria-label="Personas encontradas">{candidates.data.map(person => <Button key={person.id} type="button" className="h-auto min-h-11 justify-start whitespace-normal px-3 py-2 text-left" variant={appointment.personId === person.id ? 'default' : 'outline'} onClick={() => { setAppointment({ ...appointment, personId: person.id }); setQuery(person.displayName) }}><UsersRound aria-hidden="true" /> <span>{person.displayName} {person.identificationHint ? <span className="text-xs opacity-80">({person.identificationType ?? 'ID'} {person.identificationHint})</span> : null}</span></Button>)}</div> : null}
            </>}
            <label className="grid gap-2 text-sm font-semibold">Cargo<Select value={appointment.position} onChange={event => setAppointment({ ...appointment, position: event.target.value as BoardPosition })}>{BOARD_POSITIONS.map(position => <option key={position} value={position}>{BOARD_POSITION_LABELS[position]}</option>)}</Select></label>
            <label className="grid gap-2 text-sm font-semibold">Plaza (opcional)<Input type="number" min="1" value={appointment.seatNumber} onChange={event => setAppointment({ ...appointment, seatNumber: event.target.value })} /></label>
            <label className="grid gap-2 text-sm font-semibold">Desde (opcional)<Input type="date" value={appointment.startsOn} onChange={event => setAppointment({ ...appointment, startsOn: event.target.value })} /></label>
            <label className="grid gap-2 text-sm font-semibold">Hasta (opcional)<Input type="date" value={appointment.endsOn} onChange={event => setAppointment({ ...appointment, endsOn: event.target.value })} /></label>
            <div className="flex flex-wrap gap-2 md:col-span-2"><Button type="submit" disabled={(!editing && !appointment.personId) || mutations.createAppointment.isPending || mutations.updateAppointment.isPending}>{mutations.createAppointment.isPending || mutations.updateAppointment.isPending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Agregar nombramiento'}</Button>{editing ? <Button type="button" variant="outline" onClick={() => { setEditing(null); setAppointment(emptyAppointment); setQuery('') }}>Cancelar</Button> : null}</div>
          </form></CardContent>
        </Card> : null}
      </div>
    </div> : null}
  </section>
}
