import { useState } from 'react'
import { CheckCheck } from 'lucide-react'
import { getErrorMessage } from '@/shared/lib/errors'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { useNotificationMutations, useNotifications } from '../hooks/useNotifications'
import type { NotificationFilter } from '../model/notifications.types'
import { NotificationRow } from './NotificationCenter'

const limit = 20

export function NotificationsPage() {
  const [filter, setFilter] = useState<NotificationFilter>('ALL')
  const [page, setPage] = useState(1)
  const list = useNotifications({ filter, page, limit })
  const { markRead, markAllRead } = useNotificationMutations()
  const notifications = list.data?.data ?? []

  return <section className="space-y-6"><PageHeader context="Mi espacio" title="Notificaciones" description="Revise avisos operativos e informativos asociados a sus procesos autorizados." /><div className="flex flex-col gap-3 rounded-surface border border-erp-border bg-erp-surface-raised p-3 sm:flex-row sm:items-center sm:justify-between"><div role="group" aria-label="Filtro de notificaciones" className="flex gap-2"><Button type="button" size="sm" variant={filter === 'ALL' ? 'primary' : 'outline'} onClick={() => { setFilter('ALL'); setPage(1) }}>Todas</Button><Button type="button" size="sm" variant={filter === 'UNREAD' ? 'primary' : 'outline'} onClick={() => { setFilter('UNREAD'); setPage(1) }}>No leídas</Button></div><Button type="button" size="sm" variant="outline" disabled={markAllRead.isPending} onClick={() => markAllRead.mutate()}><CheckCheck aria-hidden="true" />Marcar todas como leídas</Button></div>{list.isPending ? <LoadingState label="Cargando notificaciones..." /> : list.isError ? <ErrorState message={getErrorMessage(list.error, 'No fue posible cargar las notificaciones.')} action={<Button type="button" variant="outline" onClick={() => void list.refetch()}>Reintentar</Button>} /> : notifications.length === 0 ? <EmptyState title={filter === 'UNREAD' ? 'No hay notificaciones sin leer' : 'No hay notificaciones'} description={filter === 'UNREAD' ? 'No tiene avisos pendientes de lectura.' : 'Los avisos operativos e informativos aparecerán aquí.'} /> : <section className="overflow-hidden rounded-surface border border-erp-border bg-erp-surface-raised" aria-label="Bandeja de notificaciones"><div className="border-b border-erp-border px-4 py-3"><p className="text-body-small text-erp-text-muted">{list.data!.total} {list.data!.total === 1 ? 'notificación' : 'notificaciones'}</p></div>{notifications.map(notification => <NotificationRow key={notification.id} notification={notification} onMarkRead={() => markRead.mutate(notification.id)} />)}<Pagination page={list.data!.page} total={list.data!.total} limit={list.data!.limit} onChange={setPage} label="Paginación de notificaciones" /></section>}</section>
}
