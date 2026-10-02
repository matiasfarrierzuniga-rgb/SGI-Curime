import { useState } from 'react'
import { Pencil, Plus, Search } from 'lucide-react'
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
import { useOpportunities, useOpportunity } from '../hooks/useOpportunities'
import type { OpportunitiesFilters, OpportunityStatus, VolunteerOpportunity } from '../model/opportunities.types'
import { OpportunityForm } from './OpportunityForm'

const INITIAL_FILTERS: OpportunitiesFilters = { page: 1, limit: 20 }
const statusLabel = (value: OpportunityStatus) => ({ DRAFT: 'Borrador', PUBLISHED: 'Publicada', CLOSED: 'Cerrada', COMPLETED: 'Completada', CANCELLED: 'Cancelada' })[value]
const statusVariant = (value: OpportunityStatus) => value === 'PUBLISHED' || value === 'COMPLETED' ? 'success' : value === 'DRAFT' ? 'neutral' : value === 'CLOSED' ? 'warning' : 'danger'
const date = (value: string) => new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(new Date(value))

export function OpportunitiesPage() {
  const { user } = useAuth()
  const { notify } = useToast()
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formOpportunity, setFormOpportunity] = useState<VolunteerOpportunity | undefined>()
  const [creating, setCreating] = useState(false)
  const opportunities = useOpportunities(filters)
  const detail = useOpportunity(selectedId)
  const mayCreate = hasCapability(user?.permissionCodes, 'vol.opportunities.create')
  const mayUpdate = hasCapability(user?.permissionCodes, 'vol.opportunities.update')
  const updateFilters = (next: Partial<OpportunitiesFilters>) => setFilters(current => ({ ...current, ...next, page: next.page ?? 1 }))
  const closeDetail = () => setSelectedId(null)

  return <section className="space-y-6">
    <PageHeader context="Gestión administrativa" title="Voluntariado" description="Consulte y mantenga las oportunidades de voluntariado." actions={mayCreate ? <Button type="button" onClick={() => setCreating(true)}><Plus aria-hidden="true" /> Registrar oportunidad</Button> : undefined} />
    <Card><CardContent className="grid gap-3 pt-6 md:grid-cols-[minmax(0,1fr)_14rem]">
      <label className="grid gap-1.5 text-label font-semibold text-foreground"><span>Buscar</span><span className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input className="pl-9" value={filters.search ?? ''} onChange={event => updateFilters({ search: event.target.value })} placeholder="Título de oportunidad" /></span></label>
      <label className="grid gap-1.5 text-label font-semibold text-foreground">Estado<Select value={filters.status ?? ''} onChange={event => updateFilters({ status: (event.target.value || undefined) as OpportunityStatus | undefined })}><option value="">Todos</option><option value="DRAFT">Borrador</option><option value="PUBLISHED">Publicada</option><option value="CLOSED">Cerrada</option><option value="COMPLETED">Completada</option><option value="CANCELLED">Cancelada</option></Select></label>
    </CardContent></Card>
    {opportunities.isPending ? <LoadingState label="Cargando oportunidades..." /> : null}
    {opportunities.isError ? <ErrorState title="No fue posible cargar las oportunidades" message={getErrorMessage(opportunities.error)} action={<Button type="button" variant="outline" onClick={() => void opportunities.refetch()}>Reintentar</Button>} /> : null}
    {!opportunities.isPending && !opportunities.isError && opportunities.data.data.length === 0 ? <EmptyState title="No hay oportunidades registradas" description={mayCreate ? 'Registre la primera oportunidad con información confirmada.' : 'No existen oportunidades disponibles para consulta.'} action={mayCreate ? <Button type="button" onClick={() => setCreating(true)}><Plus aria-hidden="true" /> Registrar oportunidad</Button> : undefined} /> : null}
    {!opportunities.isPending && !opportunities.isError && opportunities.data.data.length > 0 ? <><div className="hidden overflow-hidden rounded-xl border border-border bg-surface md:block"><table className="w-full text-left text-body-small"><thead className="bg-surface-subtle text-text-secondary"><tr><th scope="col" className="p-4 font-semibold">Oportunidad</th><th scope="col" className="p-4 font-semibold">Estado</th><th scope="col" className="p-4 font-semibold">Fecha límite</th><th scope="col" className="p-4"><span className="sr-only">Acciones</span></th></tr></thead><tbody>{opportunities.data.data.map(opportunity => <tr key={opportunity.id} className="border-t border-border align-middle hover:bg-surface-subtle/70"><td className="p-4"><p className="font-semibold text-text-primary">{opportunity.title}</p><p className="mt-1 max-w-md truncate text-text-secondary">{opportunity.location ?? 'Sin ubicación registrada'}</p></td><td className="p-4"><StatusBadge variant={statusVariant(opportunity.status)}>{statusLabel(opportunity.status)}</StatusBadge></td><td className="p-4 whitespace-nowrap text-text-secondary">{opportunity.applicationDeadline ? date(opportunity.applicationDeadline) : 'Sin fecha límite'}</td><td className="p-4 text-right"><Button type="button" size="sm" variant="outline" onClick={() => setSelectedId(opportunity.id)}>Ver detalle</Button></td></tr>)}</tbody></table></div><div className="grid gap-3 md:hidden">{opportunities.data.data.map(opportunity => <Card key={opportunity.id}><CardContent className="space-y-3 pt-5"><div><h2 className="font-semibold text-text-primary">{opportunity.title}</h2><p className="mt-1 text-body-small text-text-secondary">{opportunity.location ?? 'Sin ubicación registrada'}</p></div><div className="flex flex-wrap gap-2"><StatusBadge variant={statusVariant(opportunity.status)}>{statusLabel(opportunity.status)}</StatusBadge><span className="text-body-small text-text-secondary">{opportunity.applicationDeadline ? `Cierra ${date(opportunity.applicationDeadline)}` : 'Sin fecha límite'}</span></div><Button type="button" variant="outline" className="w-full" onClick={() => setSelectedId(opportunity.id)}>Ver detalle</Button></CardContent></Card>)}</div><Pagination page={opportunities.data.page} limit={opportunities.data.limit} total={opportunities.data.total} onChange={page => updateFilters({ page })} /></> : null}
    {selectedId !== null ? <OpportunityDetail opportunity={detail.data} loading={detail.isPending} error={detail.isError ? getErrorMessage(detail.error) : ''} onClose={closeDetail} onEdit={mayUpdate && detail.data ? () => { closeDetail(); setFormOpportunity(detail.data) } : undefined} /> : null}
    {creating ? <OpportunityForm onClose={() => setCreating(false)} onSuccess={() => notify('Oportunidad registrada correctamente.', 'success')} /> : null}
    {formOpportunity ? <OpportunityForm opportunity={formOpportunity} onClose={() => setFormOpportunity(undefined)} onSuccess={() => notify('Oportunidad actualizada correctamente.', 'success')} /> : null}
  </section>
}

function OpportunityDetail({ opportunity, loading, error, onClose, onEdit }: { opportunity?: VolunteerOpportunity; loading: boolean; error: string; onClose: () => void; onEdit?: () => void }) {
  return <Modal title="Detalle de oportunidad" onClose={onClose}>{loading ? <LoadingState label="Cargando detalle..." /> : error ? <ErrorState title="No fue posible cargar el detalle" message={error} /> : opportunity ? <div className="grid gap-5"><div><StatusBadge variant={statusVariant(opportunity.status)}>{statusLabel(opportunity.status)}</StatusBadge><h2 className="mt-3 text-heading-3 font-semibold text-text-primary">{opportunity.title}</h2></div><dl className="grid gap-4 text-body-small sm:grid-cols-2"><Detail label="Ubicación" value={opportunity.location} /><Detail label="Capacidad" value={opportunity.capacity?.toString() ?? null} /><Detail label="Fecha límite de postulación" value={opportunity.applicationDeadline ? date(opportunity.applicationDeadline) : null} /><Detail label="Descripción" value={opportunity.description} /></dl><div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">{onEdit ? <Button type="button" variant="outline" onClick={onEdit}><Pencil aria-hidden="true" /> Editar</Button> : null}<Button type="button" onClick={onClose}>Cerrar</Button></div></div> : null}</Modal>
}

function Detail({ label, value }: { label: string; value: string | null }) { return value ? <div className="grid gap-1"><dt className="font-semibold text-text-secondary">{label}</dt><dd className="whitespace-pre-wrap text-text-primary">{value}</dd></div> : null }
