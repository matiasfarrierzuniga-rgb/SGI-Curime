import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/features/auth'
import { useAdminEvents, useEventMutations } from '../hooks/useEventsQueries'
import { EventsManagementPage } from './EventsManagementPage'

vi.mock('@/features/auth', () => ({ useAuth: vi.fn() }))
vi.mock('../hooks/useEventsQueries', () => ({ useAdminEvents: vi.fn(), useEventMutations: vi.fn() }))

const mutations = {
  submitForReview: { isPending: false, mutateAsync: vi.fn() },
  returnToDraft: { isPending: false, mutateAsync: vi.fn() },
  publish: { isPending: false, mutateAsync: vi.fn() },
  archive: { isPending: false, mutateAsync: vi.fn() },
}

describe('EventsManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'Administrador' } } as never)
    vi.mocked(useEventMutations).mockReturnValue(mutations as never)
  })

  it.each([
    ['DRAFT', 'Enviar a revisión'],
    ['REVIEW', 'Devolver a borrador'],
    ['PUBLISHED', 'Archivar'],
  ])('shows only valid workflow action for %s', (publicationStatus, action) => {
    vi.mocked(useAdminEvents).mockReturnValue({ isPending: false, isError: false, data: [{ id: 1, publicId: 'event-1', title: 'Asamblea', summary: 'Resumen', description: null, startAt: '2030-01-02T10:00:00.000Z', endAt: null, location: null, status: 'SCHEDULED', publicationStatus, createdAt: '2030-01-01T10:00:00.000Z', updatedAt: '2030-01-01T10:00:00.000Z' }] } as never)

    render(<EventsManagementPage />)

    expect(screen.getByRole('button', { name: action })).toBeInTheDocument()
  })

  it('shows publishing only while event is under review', () => {
    vi.mocked(useAdminEvents).mockReturnValue({ isPending: false, isError: false, data: [{ id: 1, publicId: 'event-1', title: 'Asamblea', summary: 'Resumen', description: null, startAt: '2030-01-02T10:00:00.000Z', endAt: null, location: null, status: 'SCHEDULED', publicationStatus: 'REVIEW', createdAt: '2030-01-01T10:00:00.000Z', updatedAt: '2030-01-01T10:00:00.000Z' }] } as never)

    render(<EventsManagementPage />)

    expect(screen.getByRole('button', { name: 'Publicar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Archivar' })).not.toBeInTheDocument()
  })
})
