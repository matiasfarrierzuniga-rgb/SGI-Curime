import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { usePublicEvents } from '../hooks/useEventsQueries'
import { PublicEventsPage } from './PublicEventsPage'

vi.mock('../hooks/useEventsQueries', () => ({ usePublicEvents: vi.fn() }))

describe('PublicEventsPage', () => {
  beforeEach(() => vi.clearAllMocks())
  const renderPage = () => render(<MemoryRouter><PublicEventsPage /></MemoryRouter>)

  it('shows empty state instead of static events', () => {
    vi.mocked(usePublicEvents).mockReturnValue({ isPending: false, isError: false, data: [] } as never)
    renderPage()
    expect(screen.getByText('No hay eventos publicados en este momento')).toBeInTheDocument()
    expect(screen.queryByText('Agenda comunitaria en preparación')).not.toBeInTheDocument()
  })

  it('shows API failure without a mock fallback', () => {
    vi.mocked(usePublicEvents).mockReturnValue({ isPending: false, isError: true, error: new Error('offline'), refetch: vi.fn() } as never)
    renderPage()
    expect(screen.getByText(/No fue posible cargar los eventos publicados/i)).toBeInTheDocument()
    expect(screen.queryByText('Agenda comunitaria en preparación')).not.toBeInTheDocument()
  })

  it('renders published event projection', () => {
    vi.mocked(usePublicEvents).mockReturnValue({ isPending: false, isError: false, data: [{ publicId: 'event-1', title: 'Asamblea abierta', summary: 'Encuentro comunitario.', description: null, startAt: '2030-01-02T10:00:00.000Z', endAt: null, location: 'Salón comunal', status: 'SCHEDULED' }] } as never)
    renderPage()
    expect(screen.getByRole('heading', { name: 'Asamblea abierta' })).toBeInTheDocument()
    expect(screen.getByText('Salón comunal')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver detalle de asamblea abierta/i })).toHaveAttribute('href', '/eventos/event-1')
  })
})
