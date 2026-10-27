import type { PaginatedResponse } from '@/shared/api/api.types'

export type NotificationFilter = 'ALL' | 'UNREAD'
export type NotificationCategory = 'OPERATIONAL' | 'INFORMATIONAL'
export type NotificationPriority = 'NORMAL'
export type NotificationType = 'USER_REQUEST_SUBMITTED' | 'AFFILIATE_REQUEST_SUBMITTED' | 'RESERVATION_SUBMITTED' | 'RESERVATION_APPROVED' | 'RESERVATION_REJECTED'
export type NotificationAction = { label: string; href: string }
export type OperationalNotification = {
  id: number; type: NotificationType; category: NotificationCategory; priority: NotificationPriority
  title: string; body: string; resourceType: string; resourceId: string; readAt: string | null
  createdAt: string; expiresAt: string; action: NotificationAction | null
}
export type NotificationQuery = { page: number; limit: number; filter: NotificationFilter }
export type NotificationsPage = PaginatedResponse<OperationalNotification>
