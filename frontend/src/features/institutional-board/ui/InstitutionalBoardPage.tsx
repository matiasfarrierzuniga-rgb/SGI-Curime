import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from '@/shared/ui/DataTable'
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Select } from '@/shared/ui/select'
import { useToast } from '@/shared/ui/Toast'
import { useBoardMutations, useBoardTerms, usePersonCandidates } from '../hooks/institutionalBoard.queries'
import { BOARD_POSITIONS, BOARD_POSITION_LABELS, type BoardAppointment, type BoardPosition, type GovernanceTermStatus, type PersonCandidate } from '../model/institutionalBoard.types'

const emptyAppointment = { personId: 0, position: 'PRESIDENT' as BoardPosition, seatNumber: '', startsOn: '', endsOn: '' }
const emptyTerm = { startsOn: '', endsOn: '', status: '' as GovernanceTermStatus | '' }
const termStatusLabels: Record<GovernanceTermStatus, string> = { PLANNED: 'Planificado', ACTIVE: 'Activo', CLOSED: 'Finalizado', CANCELLED: 'Cancelado' }
const availableTermStatuses: Record<GovernanceTermStatus, readonly GovernanceTermStatus[]> = { PLANNED: ['PLANNED', 'ACTIVE', 'CANCELLED'], ACTIVE: ['ACTIVE', 'CLOSED', 'CANCELLED'], CLOSED: ['CLOSED'], CANCELLED: ['CANCELLED'] }
const dateOnly = (value: string | null) => value ? value.slice(0, 10) : 'No especificada'
const personName = (appointment: BoardAppointment) => [appointment.person.firstName, appointment.person.firstSurname, appointment.person.secondSurname].filter(Boolean).join(' ') || appointment.person.legacyFullName || `Persona ${appointment.personId}`
const toDate = (value: string) => new Date(`${value}T00:00:00`)

export function InstitutionalBoardPage() {
  const terms = useBoardTerms()
  const mutations = useBoardMutations()
  const { notify } = useToast()
  const { user } = useAuth()
  const canManage = hasCapability(user?.permissionCodes, 'adm.institutional-board.manage')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selected = terms.data?.find(term => term.id === selectedId) ?? terms.data?.[0]
  const [term, setTerm] = useState(emptyTerm)
  const [termFormOpen, setTermFormOpen] = useState(false)
  const [editingTerm, setEditingTerm] = useState(false)
  const [appointment, setAppointment] = useState(emptyAppointment)
  const [editing, setEditing] = useState<BoardAppointment | null>(null)
  const [replacing, setReplacing] = useState<BoardAppointment | null>(null)
  const [revoking, setRevoking] = useState<BoardAppointment | null>(null)
  const [revokeDate, setRevokeDate] = useState('')
  const [query, setQuery] = useState('')
  const [selectedPerson, setSelectedPerson] = useState<PersonCandidate | null>(null)
  const candidates = usePersonCandidates(query)
  const [message, setMessage] = useState('')
  const mutationBusy = mutations.createTerm.isPending || mutations.updateTerm.isPending || mutations.createAppointment.isPending || mutations.updateAppointment.isPending || mutations.replaceAppointment.isPending || mutations.revokeAppointment.isPending

  const submitTerm = async (event: FormEvent) => {
    event.preventDefault()
    if (!canManage) return
    setMessage('')
    try {
      await mutations.createTerm.mutateAsync({ startsOn: term.startsOn, endsOn: term.endsOn })
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
        input: { startsOn: term.startsOn || undefined, endsOn: term.endsOn || undefined, status: term.status || undefined },
      })
      setTerm(emptyTerm)
      setEditingTerm(false)
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const submitAppointment = async (event: FormEvent) => {
    event.preventDefault()
    if (mutationBusy) return
    setMessage('')
    if (!canManage) return
    if (!selected) {
      setMessage('Seleccione un período antes de agregar un nombramiento.')
      return
    }
    if (!editing && (!Number.isInteger(appointment.personId) || appointment.personId <= 0)) {
      setMessage('Seleccione una persona existente de la lista de resultados.')
      return
    }
    if (appointment.seatNumber && (!Number.isInteger(Number(appointment.seatNumber)) || Number(appointment.seatNumber) <= 0)) {
      setMessage('La plaza debe ser un número entero positivo.')
      return
    }
    if (appointment.startsOn && appointment.endsOn && toDate(appointment.startsOn) >= toDate(appointment.endsOn)) {
      setMessage('La fecha inicial debe ser anterior a la fecha final.')
      return
    }
    const termStart = new Date(selected.startsOn)
    const termEnd = new Date(selected.endsOn)
    const effectiveStart = appointment.startsOn ? toDate(appointment.startsOn) : termStart
    const effectiveEnd = appointment.endsOn ? toDate(appointment.endsOn) : termEnd
    if (effectiveStart > termEnd || effectiveEnd < termStart) {
      setMessage('La vigencia del nombramiento debe coincidir con el período seleccionado.')
      return
    }
    setMessage('')
    const commonInput = {
      position: appointment.position,
      seatNumber: appointment.seatNumber ? Number(appointment.seatNumber) : null,
      startsOn: appointment.startsOn || null,
      endsOn: appointment.endsOn || null,
    }
    try {
      if (editing) await mutations.updateAppointment.mutateAsync({ id: editing.id, input: commonInput })
      else if (replacing) await mutations.replaceAppointment.mutateAsync({ id: replacing.id, input: { personId: appointment.personId, ...commonInput, replacedEndsOn: replacing.endsOn?.slice(0, 10) ?? '' } })
      else await mutations.createAppointment.mutateAsync({ termId: selected.id, input: { personId: appointment.personId, ...commonInput } })
      notify(editing ? 'Nombramiento actualizado correctamente.' : replacing ? 'Nombramiento sustituido correctamente.' : 'Nombramiento agregado correctamente.', 'success')
      setAppointment(emptyAppointment)
      setSelectedPerson(null)
      setEditing(null)
      setReplacing(null)
      setQuery('')
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'No fue posible guardar el nombramiento. Revise los datos e intente nuevamente.')
      setMessage(errorMessage)
      notify(errorMessage, 'error')
    }
  }

  const edit = (item: BoardAppointment) => {
    setEditing(item)
    setReplacing(null)
    setQuery('')
    setSelectedPerson(null)
    setAppointment({
      personId: item.personId,
      position: item.position,
      seatNumber: item.seatNumber?.toString() ?? '',
      startsOn: item.startsOn?.slice(0, 10) ?? '',
      endsOn: item.endsOn?.slice(0, 10) ?? '',
    })
  }

  const replace = (item: BoardAppointment) => {
    setEditing(null)
    setReplacing(item)
    setQuery('')
    setSelectedPerson(null)
    setAppointment({ ...emptyAppointment, position: item.position, seatNumber: item.seatNumber?.toString() ?? '' })
  }

  const openRevoke = (item: BoardAppointment) => {
    setMessage('')
    setRevoking(item)
    setRevokeDate('')
  }

  const submitRevoke = async (event: FormEvent) => {
    event.preventDefault()
    if (!revoking || !selected || mutationBusy || !revokeDate) return
    const endDate = toDate(revokeDate)
    const termStart = new Date(selected.startsOn)
    const termEnd = new Date(selected.endsOn)
    const appointmentStart = revoking.startsOn ? new Date(revoking.startsOn) : termStart
    if ((revoking.startsOn ? endDate <= appointmentStart : endDate < appointmentStart) || endDate < termStart || endDate > termEnd) {
      setMessage('La fecha de revocación debe estar dentro del período y después del inicio del nombramiento.')
      return
    }
    setMessage('')
    try {
      await mutations.revokeAppointment.mutateAsync({ id: revoking.id, input: { endsOn: revokeDate } })
      notify('Nombramiento revocado correctamente.', 'success')
      setRevoking(null)
      setRevokeDate('')
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'No fue posible revocar el nombramiento.')
      setMessage(errorMessage)
      notify(errorMessage, 'error')
    }
  }

  const beginTermEdit = () => {
    if (!selected) return
    setMessage('')
    setTermFormOpen(false)
    setEditingTerm(true)
    setTerm({ startsOn: dateOnly(selected.startsOn), endsOn: dateOnly(selected.endsOn), status: selected.status ?? '' })
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
       <CardHeader><CardTitle>Editar período</CardTitle><CardDescription>Modifique las fechas y el estado según el procedimiento institucional. Finalizar un período genera revisiones técnicas, no cambios automáticos de roles.</CardDescription></CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]" onSubmit={updateSelectedTerm}>
           <label className="grid gap-2 text-sm font-semibold">Desde<Input type="date" value={term.startsOn} onChange={event => setTerm({ ...term, startsOn: event.target.value })} /></label>
           <label className="grid gap-2 text-sm font-semibold">Hasta<Input type="date" value={term.endsOn} onChange={event => setTerm({ ...term, endsOn: event.target.value })} /></label>
           <label className="grid gap-2 text-sm font-semibold">Estado{selected.status ? <Select value={term.status} onChange={event => setTerm({ ...term, status: event.target.value as GovernanceTermStatus })}>{availableTermStatuses[selected.status].map(status => <option key={status} value={status}>{termStatusLabels[status]}</option>)}</Select> : <Input value="Histórico sin estado transicionable" disabled />}</label>
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
            <DataTable className="min-w-[42rem] w-full text-left text-body-small">
              <DataTableHeader className="bg-surface-subtle text-text-secondary"><DataTableRow><DataTableHead scope="col" className="p-3 font-semibold">Cargo</DataTableHead><DataTableHead scope="col" className="p-3 font-semibold">Persona</DataTableHead><DataTableHead scope="col" className="p-3 font-semibold">Plaza</DataTableHead><DataTableHead scope="col" className="p-3 font-semibold">Vigencia</DataTableHead>{canManage ? <DataTableHead scope="col" className="p-3"><span className="sr-only">Acciones</span></DataTableHead> : null}</DataTableRow></DataTableHeader>
               <DataTableBody>{selected!.appointments.map(item => <DataTableRow key={item.id} className="border-t border-border-default align-top transition-colors hover:bg-surface-subtle/70"><DataTableCell className="p-3 font-semibold text-text-primary">{BOARD_POSITION_LABELS[item.position]}</DataTableCell><DataTableCell className="p-3 text-text-primary">{personName(item)}</DataTableCell><DataTableCell className="p-3 text-text-secondary">{item.seatNumber ?? '—'}</DataTableCell><DataTableCell className="p-3 whitespace-nowrap text-text-secondary">{dateOnly(item.startsOn)} — {dateOnly(item.endsOn)}</DataTableCell>{canManage ? <DataTableCell className="flex gap-2 p-3 text-right"><Button type="button" size="sm" variant="outline" onClick={() => edit(item)}><Pencil aria-hidden="true" /> Editar</Button>{!item.endsOn ? <><Button type="button" size="sm" variant="outline" onClick={() => replace(item)}>Sustituir</Button><Button type="button" size="sm" variant="danger" onClick={() => openRevoke(item)}>Revocar</Button></> : null}</DataTableCell> : null}</DataTableRow>)}</DataTableBody>
            </DataTable>
          </div>}</CardContent>
        </Card>

        {canManage && editing ? <Dialog open onOpenChange={open => { if (!open && !mutationBusy) { setEditing(null); setAppointment(emptyAppointment) } }}><DialogContent size="md"><form className="grid gap-4" onSubmit={submitAppointment}><DialogHeader className="pr-8"><DialogTitle>Editar nombramiento</DialogTitle><DialogDescription>Actualice los datos disponibles. La Persona vinculada se conserva como evidencia histórica.</DialogDescription></DialogHeader><div className="grid gap-2"><span className="text-sm font-semibold">Persona</span><p className="rounded-control border border-border-default bg-surface-subtle p-3" aria-label="Persona del nombramiento">{personName(editing)}</p></div><label className="grid gap-2 text-sm font-semibold">Cargo<Select value={appointment.position} onChange={event => setAppointment({ ...appointment, position: event.target.value as BoardPosition })}>{BOARD_POSITIONS.map(position => <option key={position} value={position}>{BOARD_POSITION_LABELS[position]}</option>)}</Select></label><label className="grid gap-2 text-sm font-semibold">Plaza (opcional)<Input type="number" min="1" value={appointment.seatNumber} onChange={event => setAppointment({ ...appointment, seatNumber: event.target.value })} /></label><label className="grid gap-2 text-sm font-semibold">Desde (opcional)<Input type="date" value={appointment.startsOn} onChange={event => setAppointment({ ...appointment, startsOn: event.target.value })} /></label><label className="grid gap-2 text-sm font-semibold">Hasta (opcional)<Input type="date" value={appointment.endsOn} onChange={event => setAppointment({ ...appointment, endsOn: event.target.value })} /></label>{message ? <p role="alert" className="text-body-small text-status-danger">{message}</p> : null}<DialogFooter><Button type="button" variant="outline" disabled={mutationBusy} onClick={() => { setEditing(null); setAppointment(emptyAppointment) }}>Cancelar</Button><Button type="submit" loading={mutationBusy}>Guardar cambios</Button></DialogFooter></form></DialogContent></Dialog> : null}
        {canManage && !editing ? <Card>
          <CardHeader><CardTitle>{editing ? 'Editar nombramiento' : replacing ? 'Sustituir nombramiento' : 'Agregar nombramiento'}</CardTitle><CardDescription>{editing ? 'Actualice los datos disponibles para este nombramiento.' : replacing ? 'Seleccione la persona sucesora y la fecha en que finaliza el nombramiento anterior.' : 'Busque y seleccione una persona existente antes de guardar.'}</CardDescription></CardHeader>
          <CardContent><form className="grid gap-4 md:grid-cols-2" onSubmit={submitAppointment}>
            {replacing ? <label className="grid gap-2 text-sm font-semibold md:col-span-2">Finalización del nombramiento anterior<Input type="date" required value={replacing.endsOn?.slice(0, 10) ?? ''} onChange={event => setReplacing({ ...replacing, endsOn: event.target.value || null })} /></label> : null}
            {editing ? <div className="grid gap-2 md:col-span-2"><span className="text-sm font-semibold">Persona</span><p className="rounded-control border border-border-default bg-surface-subtle p-3" aria-label="Persona del nombramiento">{personName(editing)}</p></div> : <>
              <label className="grid gap-2 text-sm font-semibold md:col-span-2">Buscar persona<Input value={query} onChange={event => { setQuery(event.target.value); setSelectedPerson(null); setAppointment({ ...appointment, personId: 0 }) }} placeholder="Nombre o identificación" aria-describedby="person-help" /><span id="person-help" className="font-normal text-text-secondary">Escriba al menos dos caracteres y seleccione una persona existente.</span></label>
              {query.trim().length >= 2 && candidates.isPending ? <LoadingState className="min-h-11 justify-start md:col-span-2" label="Buscando personas..." /> : null}
              {query.trim().length >= 2 && candidates.isError ? <ErrorState className="md:col-span-2" title="No fue posible buscar personas" message={getErrorMessage(candidates.error)} /> : null}
              {query.trim().length >= 2 && !candidates.isPending && !candidates.isError && candidates.data?.length === 0 ? <p className="md:col-span-2 text-body-small text-text-secondary">No se encontraron personas para esta búsqueda.</p> : null}
              {candidates.data?.length ? <div className="grid gap-2 md:col-span-2" role="group" aria-label="Personas encontradas">{candidates.data.map(person => <Button key={person.id} type="button" className="h-auto min-h-11 justify-start whitespace-normal px-3 py-2 text-left" variant={appointment.personId === person.id ? 'default' : 'outline'} onClick={() => { setAppointment({ ...appointment, personId: person.id }); setSelectedPerson(person); setQuery(person.displayName) }}><UsersRound aria-hidden="true" /> <span>{person.displayName} {person.identificationHint ? <span className="text-xs opacity-80">({person.identificationType ?? 'ID'} {person.identificationHint})</span> : null}</span></Button>)}</div> : null}
              {selectedPerson ? <div className="rounded-control border border-status-success/40 bg-status-success/10 p-3 text-body-small text-text-primary md:col-span-2" role="status"><span className="font-semibold">Persona seleccionada:</span> {selectedPerson.displayName} <span className="text-text-secondary">· ID canónico #{selectedPerson.id}{selectedPerson.identificationHint ? ` · ${selectedPerson.identificationType ?? 'ID'} ${selectedPerson.identificationHint}` : ''}</span></div> : null}
            </>}
            <label className="grid gap-2 text-sm font-semibold">Cargo<Select value={appointment.position} onChange={event => setAppointment({ ...appointment, position: event.target.value as BoardPosition })}>{BOARD_POSITIONS.map(position => <option key={position} value={position}>{BOARD_POSITION_LABELS[position]}</option>)}</Select></label>
            <label className="grid gap-2 text-sm font-semibold">Plaza (opcional)<Input type="number" min="1" value={appointment.seatNumber} onChange={event => setAppointment({ ...appointment, seatNumber: event.target.value })} /></label>
            <label className="grid gap-2 text-sm font-semibold">Desde (opcional)<Input type="date" value={appointment.startsOn} onChange={event => setAppointment({ ...appointment, startsOn: event.target.value })} /></label>
            <label className="grid gap-2 text-sm font-semibold">Hasta (opcional)<Input type="date" value={appointment.endsOn} onChange={event => setAppointment({ ...appointment, endsOn: event.target.value })} /></label>
              <div className="flex flex-wrap gap-2 md:col-span-2"><Button type="submit" disabled={mutationBusy}>{mutationBusy ? 'Guardando…' : editing ? 'Guardar cambios' : replacing ? 'Confirmar sustitución' : 'Agregar nombramiento'}</Button>{editing || replacing ? <Button type="button" variant="outline" onClick={() => { setEditing(null); setReplacing(null); setSelectedPerson(null); setAppointment(emptyAppointment); setQuery('') }} disabled={mutationBusy}>Cancelar</Button> : null}</div>
          </form></CardContent>
       </Card> : null}
        {revoking ? <Dialog open onOpenChange={open => { if (!open && !mutations.revokeAppointment.isPending) { setRevoking(null); setRevokeDate('') } }}><DialogContent size="sm"><form className="grid gap-6" onSubmit={(event) => void submitRevoke(event)}><DialogHeader className="pr-8"><DialogTitle>Revocar nombramiento</DialogTitle><DialogDescription>El registro se conservará y se establecerá una fecha de finalización para la persona nombrada.</DialogDescription></DialogHeader><label className="grid gap-2 text-sm font-semibold">Fecha efectiva de revocación<Input type="date" required value={revokeDate} onChange={event => setRevokeDate(event.target.value)} aria-describedby={message ? 'revoke-error' : undefined} aria-invalid={Boolean(message)} /></label>{message ? <p id="revoke-error" className="text-body-small text-status-danger" role="alert">{message}</p> : null}<DialogFooter><Button type="button" variant="outline" onClick={() => { setRevoking(null); setRevokeDate('') }} disabled={mutationBusy}>Cancelar</Button><Button type="submit" variant="danger" loading={mutationBusy}>Confirmar revocación</Button></DialogFooter></form></DialogContent></Dialog> : null}
      </div>
    </div> : null}
  </section>
}
