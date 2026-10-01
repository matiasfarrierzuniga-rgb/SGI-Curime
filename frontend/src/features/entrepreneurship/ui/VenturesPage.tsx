import { useState } from 'react'
import { ExternalLink, Pencil, Plus, Search } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { getErrorMessage } from '@/shared/lib/errors'
import { hasCapability } from '@/shared/security/access'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Input } from '@/shared/ui/input'
import { LoadingState } from '@/shared/ui/LoadingState'
import { Modal } from '@/shared/ui/Modal'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { Select } from '@/shared/ui/select'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { useToast } from '@/shared/ui/Toast'
import { useVenture, useVentures } from '../hooks/useVentures'
import type { Venture, VenturePublicationStatus, VentureStatus, VenturesFilters } from '../model/ventures.types'
import { VentureForm } from './VentureForm'

const INITIAL_FILTERS: VenturesFilters = { page: 1, limit: 20 }
const stateLabel = (value: string) => ({ ACTIVE: 'Activo', SUSPENDED: 'Suspendido', CLOSED: 'Cerrado', UNPUBLISHED: 'No publicado', PUBLISHED: 'Publicado' }[value] ?? `Estado desconocido (${value})`)
const stateVariant = (value: string) => value === 'ACTIVE' || value === 'PUBLISHED' ? 'success' : value === 'SUSPENDED' ? 'warning' : value === 'CLOSED' ? 'danger' : 'neutral'
const date = (value: string) => new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(new Date(value))

export function VenturesPage() {
  const { user } = useAuth()
  const { notify } = useToast()
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formVenture, setFormVenture] = useState<Venture | undefined>()
  const [creating, setCreating] = useState(false)
  const ventures = useVentures(filters)
  const detail = useVenture(selectedId)
  const mayCreate = hasCapability(user?.permissionCodes, 'ent.ventures.create')
  const mayUpdate = hasCapability(user?.permissionCodes, 'ent.ventures.update')
  const updateFilters = (next: Partial<VenturesFilters>) => setFilters(current => ({ ...current, ...next, page: next.page ?? 1 }))
  const closeDetail = () => setSelectedId(null)

  return <section className="space-y-6">
    <PageHeader context="Gestión administrativa" title="Emprendimientos" description="Consulte y mantenga los emprendimientos registrados." actions={mayCreate ? <Button type="button" onClick={() => setCreating(true)}><Plus aria-hidden="true" /> Registrar emprendimiento</Button> : undefined} />
    <Card><CardContent className="grid gap-3 pt-6 md:grid-cols-[minmax(0,1fr)_13rem_13rem]">
      <label className="grid gap-1.5 text-label font-semibold text-foreground"><span>Buscar</span><span className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input className="pl-9" value={filters.search ?? ''} onChange={event => updateFilters({ search: event.target.value })} placeholder="Nombre del emprendimiento" /></span></label>
      <label className="grid gap-1.5 text-label font-semibold text-foreground">Estado<Select value={filters.status ?? ''} onChange={event => updateFilters({ status: (event.target.value || undefined) as VentureStatus | undefined })}><option value="">Todos</option><option value="ACTIVE">Activo</option><option value="SUSPENDED">Suspendido</option><option value="CLOSED">Cerrado</option></Select></label>
      <label className="grid gap-1.5 text-label font-semibold text-foreground">Publicación<Select value={filters.publicationStatus ?? ''} onChange={event => updateFilters({ publicationStatus: (event.target.value || undefined) as VenturePublicationStatus | undefined })}><option value="">Todas</option><option value="UNPUBLISHED">No publicado</option><option value="PUBLISHED">Publicado</option></Select></label>
    </CardContent></Card>
    {ventures.isPending ? <LoadingState label="Cargando emprendimientos..." /> : null}
    {ventures.isError ? <ErrorState title="No fue posible cargar los emprendimientos" message={getErrorMessage(ventures.error)} action={<Button type="button" variant="outline" onClick={() => void ventures.refetch()}>Reintentar</Button>} /> : null}
    {!ventures.isPending && !ventures.isError && ventures.data.data.length === 0 ? <EmptyState title="No hay emprendimientos registrados" description={mayCreate ? 'Registre el primero cuando cuente con información confirmada.' : 'No existen emprendimientos disponibles para consulta.'} action={mayCreate ? <Button type="button" onClick={() => setCreating(true)}><Plus aria-hidden="true" /> Registrar emprendimiento</Button> : undefined} /> : null}
    {!ventures.isPending && !ventures.isError && ventures.data.data.length > 0 ? <><div className="hidden overflow-hidden rounded-xl border border-border bg-surface md:block"><table className="w-full text-left text-body-small"><thead className="bg-surface-subtle text-text-secondary"><tr><th scope="col" className="p-4 font-semibold">Emprendimiento</th><th scope="col" className="p-4 font-semibold">Estado</th><th scope="col" className="p-4 font-semibold">Publicación</th><th scope="col" className="p-4 font-semibold">Incorporación</th><th scope="col" className="p-4"><span className="sr-only">Acciones</span></th></tr></thead><tbody>{ventures.data.data.map(venture => <tr key={venture.id} className="border-t border-border align-middle hover:bg-surface-subtle/70"><td className="p-4"><p className="font-semibold text-text-primary">{venture.name}</p><p className="mt-1 max-w-md truncate text-text-secondary">{venture.locationText ?? 'Sin ubicación registrada'}</p></td><td className="p-4"><StatusBadge variant={stateVariant(venture.status)}>{stateLabel(venture.status)}</StatusBadge></td><td className="p-4"><StatusBadge variant={stateVariant(venture.publicationStatus)}>{stateLabel(venture.publicationStatus)}</StatusBadge></td><td className="p-4 whitespace-nowrap text-text-secondary">{date(venture.incorporatedAt)}</td><td className="p-4 text-right"><Button type="button" size="sm" variant="outline" onClick={() => setSelectedId(venture.id)}>Ver detalle</Button></td></tr>)}</tbody></table></div><div className="grid gap-3 md:hidden">{ventures.data.data.map(venture => <Card key={venture.id}><CardContent className="space-y-3 pt-5"><div><h2 className="font-semibold text-text-primary">{venture.name}</h2><p className="mt-1 text-body-small text-text-secondary">{venture.locationText ?? 'Sin ubicación registrada'}</p></div><div className="flex flex-wrap gap-2"><StatusBadge variant={stateVariant(venture.status)}>{stateLabel(venture.status)}</StatusBadge><StatusBadge variant={stateVariant(venture.publicationStatus)}>{stateLabel(venture.publicationStatus)}</StatusBadge></div><p className="text-body-small text-text-secondary">Incorporación: {date(venture.incorporatedAt)}</p><Button type="button" variant="outline" className="w-full" onClick={() => setSelectedId(venture.id)}>Ver detalle</Button></CardContent></Card>)}</div><Pagination page={ventures.data.page} total={ventures.data.total} limit={ventures.data.limit} onChange={page => updateFilters({ page })} /></> : null}
    {selectedId !== null ? <VentureDetail venture={detail.data} loading={detail.isPending} error={detail.isError ? getErrorMessage(detail.error) : ''} onClose={closeDetail} onEdit={mayUpdate && detail.data ? () => { closeDetail(); setFormVenture(detail.data) } : undefined} /> : null}
    {creating ? <VentureForm onClose={() => setCreating(false)} onSuccess={() => notify('Emprendimiento registrado correctamente.', 'success')} /> : null}
    {formVenture ? <VentureForm venture={formVenture} onClose={() => setFormVenture(undefined)} onSuccess={() => notify('Emprendimiento actualizado correctamente.', 'success')} /> : null}
  </section>
}

function VentureDetail({ venture, loading, error, onClose, onEdit }: { venture?: Venture; loading: boolean; error: string; onClose: () => void; onEdit?: () => void }) {
  return <Modal title="Detalle del emprendimiento" onClose={onClose}>{loading ? <LoadingState label="Cargando detalle..." /> : error ? <ErrorState title="No fue posible cargar el detalle" message={error} /> : venture ? <div className="grid gap-5"><div><div className="flex flex-wrap gap-2"><StatusBadge variant={stateVariant(venture.status)}>{stateLabel(venture.status)}</StatusBadge><StatusBadge variant={stateVariant(venture.publicationStatus)}>{stateLabel(venture.publicationStatus)}</StatusBadge></div><h2 className="mt-3 text-heading-3 font-semibold text-text-primary">{venture.name}</h2></div><Details venture={venture} /><div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">{onEdit ? <Button type="button" variant="outline" onClick={onEdit}><Pencil aria-hidden="true" /> Editar</Button> : null}<Button type="button" onClick={onClose}>Cerrar</Button></div></div> : null}</Modal>
}

function Details({ venture }: { venture: Venture }) {
  const fields = [['Fecha de incorporación', date(venture.incorporatedAt)], ['Ubicación', venture.locationText], ['Teléfono comercial', venture.businessPhone], ['Correo comercial', venture.businessEmail], ['Descripción', venture.description], ['Oferta comercial', venture.offerDescription]]
  return <dl className="grid gap-4 text-body-small sm:grid-cols-2">{fields.map(([label, value]) => value ? <div key={label} className="grid gap-1"><dt className="font-semibold text-text-secondary">{label}</dt><dd className="whitespace-pre-wrap text-text-primary">{value}</dd></div> : null)}{venture.websiteUrl ? <LinkField label="Sitio web" href={venture.websiteUrl} /> : null}{venture.socialUrl ? <LinkField label="Red social" href={venture.socialUrl} /> : null}</dl>
}
function LinkField({ label, href }: { label: string; href: string }) { return <div className="grid gap-1"><dt className="font-semibold text-text-secondary">{label}</dt><dd><a className="inline-flex items-center gap-1 text-interaction-primary-default underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2" href={href} target="_blank" rel="noreferrer"><span className="max-w-56 truncate">{href}</span><ExternalLink className="size-3" aria-hidden="true" /></a></dd></div> }
