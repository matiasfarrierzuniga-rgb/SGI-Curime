import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { eventsApi } from '../api/events.api'
import type { EventPayload } from '../model/events.types'

export const eventsKeys = {
  all: ['events'] as const,
  public: () => [...eventsKeys.all, 'public'] as const,
  admin: () => [...eventsKeys.all, 'admin'] as const,
}

export function usePublicEvents() {
  return useQuery({ queryKey: eventsKeys.public(), queryFn: eventsApi.listPublic })
}

export function useAdminEvents() {
  return useQuery({ queryKey: eventsKeys.admin(), queryFn: eventsApi.listAdmin })
}

export function useEventMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: eventsKeys.all })
  return {
    create: useMutation({ mutationFn: (payload: EventPayload) => eventsApi.create(payload), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: number; payload: EventPayload }) => eventsApi.update(id, payload), onSuccess: invalidate }),
    publish: useMutation({ mutationFn: eventsApi.publish, onSuccess: invalidate }),
    archive: useMutation({ mutationFn: eventsApi.archive, onSuccess: invalidate }),
  }
}
