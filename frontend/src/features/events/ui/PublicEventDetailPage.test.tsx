import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePublicEvent } from '../hooks/useEventsQueries'
import { PublicEventDetailPage } from './PublicEventDetailPage'

vi.mock('../hooks/useEventsQueries', () => ({ usePublicEvent: vi.fn() }))

function renderPage() {
  return render(<MemoryRouter initialEntries={['/eventos/event-1']}><Routes><Route path="/eventos/:publicId" element={<PublicEventDetailPage />} /></Routes></MemoryRouter>)
}

describe('PublicEventDetailPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders only public event fields', () => {
    vi.mocked(usePublicEvent).mockReturnValue({ isPending: false, isError: false, data: { publicId: 'event-1', title: 'Asamblea abierta', summary: 'Encuentro comunitario.', description: 'Orden del día confirmado.', startAt: '2030-01-02T10:00:00.000Z', endAt: null, location: 'Salón comunal', status: 'SCHEDULED' } } as never)

    renderPage()

    expect(screen.getByRole('heading', { name: 'Asamblea abierta' })).toBeInTheDocument()
    expect(screen.getByText('Orden del día confirmado.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /volver a eventos/i })).toHaveAttribute('href', '/eventos')
  })

  it('shows unavailable state for unpublished or unknown events', () => {
    vi.mocked(usePublicEvent).mockReturnValue({ isPending: false, isError: true, error: new Error('Not Found') } as never)

    renderPage()

    expect(screen.getByRole('alert')).toHaveTextContent('Evento no disponible')
  })
})
