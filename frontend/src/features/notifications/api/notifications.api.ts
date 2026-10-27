import { httpClient } from '@/shared/api/httpClient'
import type { NotificationQuery, NotificationsPage, OperationalNotification } from '../model/notifications.types'

export const notificationsApi = {
  async list(params: NotificationQuery) { return (await httpClient.get<NotificationsPage>('/notifications', { params })).data },
  async unreadCount() { return (await httpClient.get<{ unread: number }>('/notifications/unread-count')).data },
  async markRead(id: number) { return (await httpClient.patch<OperationalNotification>(`/notifications/${id}/read`)).data },
  async markAllRead() { return (await httpClient.patch<{ updated: number }>('/notifications/read-all')).data },
}
