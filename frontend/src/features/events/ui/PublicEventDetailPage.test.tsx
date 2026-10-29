import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePublicEvent } from '../hooks/useEventsQueries'
import { PublicEventDetailPage } from './PublicEventDetailPage'

vi.mock('../hooks/useEventsQueries', () => ({ usePublicEvent: vi.fn() }))

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value))
}

function renderPage() {
  return render(<MemoryRouter initialEntries={['/eventos/event-1']}><Routes><Route path="/eventos/:publicId" element={<PublicEventDetailPage />} /></Routes></MemoryRouter>)
}

describe('PublicEventDetailPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows loading state without event content', () => {
    vi.mocked(usePublicEvent).mockReturnValue({ isPending: true, isError: false, data: undefined } as never)
    renderPage()
    expect(screen.getByText('Cargando evento...')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Asamblea abierta' })).not.toBeInTheDocument()
  })

  it('renders only public event fields', () => {
    const startAt = '2030-01-02T10:00:00.000Z'
    const endAt = '2030-01-02T12:00:00.000Z'
    vi.mocked(usePublicEvent).mockReturnValue({ isPending: false, isError: false, data: { publicId: 'event-1', title: 'Asamblea abierta', summary: 'Encuentro comunitario.', description: 'Orden del día confirmado.', startAt, endAt, location: 'Salón comunal', status: 'SCHEDULED' } } as never)

    renderPage()

    expect(screen.getByRole('heading', { name: 'Asamblea abierta' })).toBeInTheDocument()
    expect(screen.getByText('Orden del día confirmado.')).toBeInTheDocument()
    expect(screen.getByText('Inicio')).toBeInTheDocument()
    expect(screen.getByText(formatDate(startAt))).toBeInTheDocument()
    expect(screen.getByText('Finalización')).toBeInTheDocument()
    expect(screen.getByText(formatDate(endAt))).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /volver a eventos/i })).toHaveAttribute('href', '/eventos')
  })

  it('omits unavailable optional content', () => {
    vi.mocked(usePublicEvent).mockReturnValue({ isPending: false, isError: false, data: { publicId: 'event-1', title: 'Asamblea abierta', summary: 'Encuentro comunitario.', description: null, startAt: '2030-01-02T10:00:00.000Z', endAt: null, location: null, status: 'SCHEDULED' } } as never)
    renderPage()
    expect(screen.queryByRole('heading', { name: 'Descripción del evento' })).not.toBeInTheDocument()
    expect(screen.queryByText('Lugar')).not.toBeInTheDocument()
  })

  it('communicates a scheduled event with a past date', () => {
    vi.mocked(usePublicEvent).mockReturnValue({ isPending: false, isError: false, data: { publicId: 'event-1', title: 'Asamblea anterior', summary: 'Encuentro ya realizado.', description: null, startAt: '2000-01-02T10:00:00.000Z', endAt: null, location: null, status: 'SCHEDULED' } } as never)
    renderPage()
    expect(screen.getByText('Fecha transcurrida')).toBeInTheDocument()
    expect(screen.getByText(/La fecha programada ya transcurrió/i)).toBeInTheDocument()
  })

  it('shows unavailable state for unpublished or unknown events', () => {
    vi.mocked(usePublicEvent).mockReturnValue({ isPending: false, isError: true, error: new Error('Not Found') } as never)

    renderPage()

    expect(screen.getByRole('alert')).toHaveTextContent('Evento no disponible')
    expect(screen.getByRole('link', { name: 'Ver eventos' })).toHaveAttribute('href', '/eventos')
    expect(screen.queryByRole('heading', { name: 'Asamblea abierta' })).not.toBeInTheDocument()
  })
})
