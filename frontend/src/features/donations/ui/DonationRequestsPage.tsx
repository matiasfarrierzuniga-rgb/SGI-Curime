import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuth } from '@/features/auth'
import { getErrorMessage } from '@/shared/lib/errors'
import { hasCapability } from '@/shared/security/access'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Input } from '@/shared/ui/input'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { donationRequestsApi, type DonationRequest } from '../api/donationRequests.api'

const statusLabel = { PENDING: 'Pendiente', IN_REVIEW: 'En revisión', REJECTED: 'Rechazada', CANCELLED: 'Cancelada' }
const kindLabel = { MONETARY: 'Dinero', IN_KIND: 'Bienes' }
const modalityLabel = { DIGITAL: 'Digital', IN_PERSON: 'Presencial', COORDINATED: 'Coordinada' }

export function DonationRequestsPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const mayRead = hasCapability(user?.permissionCodes, 'don.requests.read')
  const mayReview = hasCapability(user?.permissionCodes, 'don.requests.review')
  const list = useQuery({ queryKey: ['donation-requests', page], queryFn: () => donationRequestsApi.list(page), enabled: mayRead })
  const transition = useMutation({ mutationFn: ({ id, action, reason }: { id: string; action: 'review' | 'reject' | 'cancel'; reason?: string }) => donationRequestsApi.transition(id, action, reason), onSuccess: () => { setError(null); void queryClient.invalidateQueries({ queryKey: ['donation-requests'] }) } })

  async function act(request: DonationRequest, action: 'review' | 'reject' | 'cancel') {
    const reason = reasons[request.id]?.trim()
    if (action !== 'review' && (!reason || reason.length < 3)) { setError('Indique un motivo de al menos tres caracteres.'); return }
    setError(null)
    try { await transition.mutateAsync({ id: request.id, action, reason }) }
    catch (cause) { setError(getErrorMessage(cause, 'No fue posible actualizar la solicitud.')) }
  }

  if (!mayRead) return <ErrorState title="Acceso restringido" message="No tiene permiso para consultar solicitudes de donación." />
  return <section className="space-y-6">
    <PageHeader context="Gestión de donaciones" title="Solicitudes públicas" description="Revise intenciones de donar. Este flujo no confirma recepción ni registra ingresos contables." />
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    {list.isPending ? <LoadingState label="Cargando solicitudes…" /> : null}
    {list.isError ? <ErrorState title="No fue posible cargar las solicitudes" message={getErrorMessage(list.error, 'Intente de nuevo.')} action={<Button type="button" variant="outline" onClick={() => void list.refetch()}>Reintentar</Button>} /> : null}
    {list.data?.data.length === 0 ? <EmptyState title="No hay solicitudes" description="Las solicitudes públicas aparecerán aquí cuando se reciban." /> : null}
    <div className="grid gap-4">{list.data?.data.map(request => <article key={request.id} className="rounded-surface border border-border-default bg-surface-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-heading text-heading-3 text-text-primary">{request.donorName}</h2><p className="mt-1 text-sm text-text-secondary">{kindLabel[request.kind]} · {modalityLabel[request.modality]} · {statusLabel[request.status]}</p></div><time className="text-sm text-text-secondary" dateTime={request.createdAt}>{new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeZone: 'America/Costa_Rica' }).format(new Date(request.createdAt))}</time></div>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><div><dt className="font-semibold">Contacto</dt><dd className="break-words">{[request.email, request.phone].filter(Boolean).join(' · ')}</dd></div><div><dt className="font-semibold">Aporte propuesto</dt><dd>{request.kind === 'MONETARY' ? `₡${request.approximateAmount} aprox. ${request.paymentPreference ? `· ${request.paymentPreference === 'SINPE' ? 'SINPE Móvil' : 'Transferencia'}` : ''}` : request.goodsDescription}</dd></div>{request.comments ? <div className="sm:col-span-2"><dt className="font-semibold">Comentarios</dt><dd className="whitespace-pre-wrap break-words">{request.comments}</dd></div> : null}<div><dt className="font-semibold">Visibilidad pública</dt><dd>{request.anonymousPublic ? 'Nombre anónimo' : 'Nombre visible si se publica posteriormente'}</dd></div>{request.reviewReason ? <div><dt className="font-semibold">Motivo administrativo</dt><dd className="whitespace-pre-wrap">{request.reviewReason}</dd></div> : null}</dl>
      {mayReview && (request.status === 'PENDING' || request.status === 'IN_REVIEW') ? <div className="mt-5 space-y-3 border-t border-border-subtle pt-4"><label className="block text-sm font-semibold" htmlFor={`reason-${request.id}`}>Motivo para rechazo o cancelación</label><Input id={`reason-${request.id}`} value={reasons[request.id] ?? ''} maxLength={1000} onChange={event => setReasons(current => ({ ...current, [request.id]: event.target.value }))} /><div className="flex flex-wrap gap-2">{request.status === 'PENDING' ? <Button type="button" disabled={transition.isPending} onClick={() => void act(request, 'review')}>Iniciar revisión</Button> : null}<Button type="button" variant="outline" disabled={transition.isPending} onClick={() => void act(request, 'reject')}>Rechazar</Button><Button type="button" variant="outline" disabled={transition.isPending} onClick={() => void act(request, 'cancel')}>Cancelar</Button></div></div> : null}
    </article>)}</div>
    {list.data && list.data.total > 20 ? <Pagination page={page} total={list.data.total} limit={20} onChange={setPage} /> : null}
  </section>
}
