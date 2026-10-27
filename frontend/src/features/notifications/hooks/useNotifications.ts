import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../api/notifications.api'
import type { NotificationQuery } from '../model/notifications.types'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (query: NotificationQuery) => [...notificationKeys.all, 'list', query] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
}

const refreshOptions = { refetchInterval: 60_000, refetchOnWindowFocus: true } as const

export function useNotifications(query: NotificationQuery, enabled = true) {
  return useQuery({ queryKey: notificationKeys.list(query), queryFn: () => notificationsApi.list(query), enabled, ...refreshOptions })
}

export function useUnreadNotificationCount(enabled = true) {
  return useQuery({ queryKey: notificationKeys.unreadCount(), queryFn: notificationsApi.unreadCount, enabled, ...refreshOptions })
}

export function useNotificationMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: notificationKeys.all })
  return {
    markRead: useMutation({ mutationFn: notificationsApi.markRead, onSuccess: invalidate }),
    markAllRead: useMutation({ mutationFn: notificationsApi.markAllRead, onSuccess: invalidate }),
  }
}
