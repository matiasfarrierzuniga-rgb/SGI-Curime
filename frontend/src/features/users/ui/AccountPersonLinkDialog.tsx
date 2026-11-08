import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Field, FieldDescription, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { getErrorMessage } from '@/shared/lib/errors'
import { usePersonLinkCandidates } from '../hooks/useUsersQueries'
import type { User } from '../model/users.types'

const schema = z.object({
  evidenceReference: z.string().trim().min(3, 'Indique la referencia de verificación.').max(120),
  reason: z.string().trim().min(5, 'Explique brevemente la decisión administrativa.').max(500),
})
type FormValues = z.infer<typeof schema>

type Props = {
  account: User | null
  busy: boolean
  error: unknown
  onClose: () => void
  onConfirm: (input: FormValues & { personId: number }) => void
}

export function AccountPersonLinkDialog({ account, busy, error, onClose, onConfirm }: Props) {
  const [query, setQuery] = useState('')
  const [personId, setPersonId] = useState<number | null>(null)
  const candidates = usePersonLinkCandidates(query, Boolean(account))
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { evidenceReference: '', reason: '' } })
  if (!account?.access) return null
  const selected = candidates.data?.find(candidate => candidate.id === personId)
  const submit = form.handleSubmit(values => {
    if (!personId) return
    onConfirm({ ...values, personId })
  })
  const selectionError = form.formState.isSubmitted && !personId ? 'Seleccione una Persona canónica antes de confirmar.' : null
  const mutationError = error ? getErrorMessage(error, 'No fue posible vincular la cuenta.') : null

  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose() }}><DialogContent size="md"><form className="grid gap-5" onSubmit={submit}><DialogHeader className="pr-8"><DialogTitle>Vincular cuenta con Persona</DialogTitle><DialogDescription>Esta decisión une una cuenta individual con una Persona canónica. No cambia afiliación, nombramiento, rol ni permisos.</DialogDescription></DialogHeader><div className="rounded-control border border-border-default bg-surface-subtle p-3 text-body-small"><span className="font-semibold text-text-primary">Cuenta SGI: </span>{account.access.email}<br /><span className="font-semibold text-text-primary">Estado: </span>{account.access.status}<br /><span className="font-semibold text-text-primary">Rol: </span>{account.access.role.label}</div><Field><FieldLabel htmlFor="person-search">Buscar Persona canónica</FieldLabel><FieldDescription>Busque por nombre o identificación y seleccione explícitamente un resultado sin cuenta vinculada.</FieldDescription><Input id="person-search" value={query} onChange={event => { setQuery(event.target.value); setPersonId(null) }} placeholder="Nombre o identificación" autoComplete="off" /></Field>{query.trim().length >= 2 && candidates.isPending ? <p className="text-body-small text-text-secondary">Buscando Personas…</p> : null}{candidates.isError ? <p role="alert" className="text-body-small text-status-danger">{getErrorMessage(candidates.error, 'No fue posible buscar Personas.')}</p> : null}{candidates.data?.length ? <div className="grid gap-2" role="group" aria-label="Personas candidatas">{candidates.data.map(candidate => <Button key={candidate.id} type="button" variant={personId === candidate.id ? 'primary' : 'outline'} className="h-auto min-h-11 justify-start whitespace-normal px-3 py-2 text-left" onClick={() => setPersonId(candidate.id)}><span>{candidate.displayName}{candidate.identificationHint ? ` (${candidate.identificationHint})` : ''}<span className="block text-caption font-normal opacity-80">{candidate.affiliateStatus === 'ACTIVE' ? 'Afiliación activa' : candidate.affiliateStatus === 'INACTIVE' ? 'Afiliación inactiva' : 'Sin afiliación'}</span></span></Button>)}</div> : null}{query.trim().length >= 2 && !candidates.isPending && !candidates.isError && candidates.data?.length === 0 ? <p className="text-body-small text-text-secondary">No hay Personas sin cuenta vinculada para esta búsqueda.</p> : null}{selected ? <p className="rounded-control border border-brand-soft bg-surface-subtle p-3 text-body-small"><span className="font-semibold">Persona seleccionada: </span>{selected.displayName}. Revise evidencia antes de confirmar.</p> : null}<Field><FieldLabel htmlFor="link-evidence">Referencia de verificación</FieldLabel><Input id="link-evidence" {...form.register('evidenceReference')} aria-invalid={Boolean(form.formState.errors.evidenceReference)} /><FieldDescription>{form.formState.errors.evidenceReference?.message}</FieldDescription></Field><Field><FieldLabel htmlFor="link-reason">Motivo administrativo</FieldLabel><Input id="link-reason" {...form.register('reason')} aria-invalid={Boolean(form.formState.errors.reason)} /><FieldDescription>{form.formState.errors.reason?.message}</FieldDescription></Field>{selectionError || mutationError ? <p role="alert" className="text-body-small text-status-danger">{selectionError ?? mutationError}</p> : null}<DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancelar</Button><Button type="submit" variant="primary" loading={busy}>Confirmar vinculación</Button></DialogFooter></form></DialogContent></Dialog>
}
