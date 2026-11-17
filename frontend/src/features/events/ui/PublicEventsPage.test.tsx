import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { usePublicEvents } from '../hooks/useEventsQueries'
import { PublicEventsPage } from './PublicEventsPage'

vi.mock('../hooks/useEventsQueries', () => ({ usePublicEvents: vi.fn() }))

describe('PublicEventsPage', () => {
  beforeEach(() => vi.clearAllMocks())
  const renderPage = () => render(<MemoryRouter><PublicEventsPage /></MemoryRouter>)
  const scheduledEvent = {
    publicId: 'event-1',
    title: 'Asamblea abierta',
    summary: 'Encuentro comunitario.',
    description: 'Información adicional de la asamblea.',
    startAt: '2030-01-02T10:00:00.000Z',
    endAt: '2030-01-02T12:00:00.000Z',
    location: 'Salón comunal',
    status: 'SCHEDULED',
  }

  it('shows empty state instead of static events', () => {
    vi.mocked(usePublicEvents).mockReturnValue({ isPending: false, isError: false, data: [] } as never)
    renderPage()
    expect(screen.getByRole('navigation', { name: 'Ruta de navegación' })).toHaveTextContent('Eventos')
    expect(screen.getByRole('heading', { name: 'Eventos', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('No hay eventos publicados en este momento')).toBeInTheDocument()
    expect(screen.queryByRole('search')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: /paginación/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Agenda comunitaria en preparación')).not.toBeInTheDocument()
  })

  it('shows the shared loading state', () => {
    vi.mocked(usePublicEvents).mockReturnValue({ isPending: true, isError: false } as never)
    renderPage()
    expect(screen.getByRole('status')).toHaveTextContent('Cargando eventos publicados')
    expect(screen.getByRole('status')).toHaveClass('rounded-surface', 'border', 'bg-surface-card')
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('shows API failure without a mock fallback and keeps retry available', () => {
    const refetch = vi.fn()
    vi.mocked(usePublicEvents).mockReturnValue({ isPending: false, isError: true, error: new Error('offline'), refetch } as never)
    renderPage()
    expect(screen.getByRole('alert')).toHaveTextContent('No fue posible cargar los eventos')
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(refetch).toHaveBeenCalledOnce()
    expect(screen.queryByText('Agenda comunitaria en preparación')).not.toBeInTheDocument()
  })

  it('renders published event details in a responsive card', () => {
    vi.mocked(usePublicEvents).mockReturnValue({ isPending: false, isError: false, data: [scheduledEvent] } as never)
    renderPage()
    const card = screen.getByRole('article')
    expect(card).toHaveClass('h-full', 'min-w-0', 'rounded-surface', 'flex-col')
    expect(card.parentElement).toHaveClass('grid', 'min-w-0', 'grid-cols-1', 'md:grid-cols-2', 'xl:grid-cols-3')
    expect(within(card).getByRole('heading', { name: 'Asamblea abierta', level: 3 })).toHaveClass('text-heading-3', 'leading-snug')
    expect(within(card).getByText('Encuentro comunitario.')).toHaveClass('text-pretty', 'leading-relaxed')
    expect(within(card).getByText('Programado')).toHaveClass('bg-status-info-surface')
    const expectedStart = new Intl.DateTimeFormat('es-CR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(scheduledEvent.startAt))
    const expectedEnd = new Intl.DateTimeFormat('es-CR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(scheduledEvent.endAt))
    expect(within(card).getByText('Fecha y hora').nextElementSibling).toHaveTextContent(`${expectedStart} – ${expectedEnd}`)
    expect(within(card).getByText('Ubicación').nextElementSibling).toHaveTextContent('Salón comunal')
    expect(within(card).getByRole('link', { name: 'Ver detalle de Asamblea abierta' })).toHaveAttribute('href', '/eventos/event-1')
    expect(within(card).queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByRole('search')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: /paginación/i })).not.toBeInTheDocument()
  })

  it('keeps completed events in the archive and only shows available location data', () => {
    const completedEvent = { ...scheduledEvent, publicId: 'event-past', title: 'Actividad finalizada', startAt: '2020-01-02T10:00:00.000Z', endAt: null, location: null, status: 'COMPLETED' }
    vi.mocked(usePublicEvents).mockReturnValue({ isPending: false, isError: false, data: [completedEvent] } as never)
    renderPage()
    const card = screen.getByRole('article')
    expect(screen.getByRole('heading', { name: 'Eventos anteriores' })).toBeVisible()
    expect(within(card).getByText('Actividad realizada')).toHaveClass('bg-status-neutral-surface')
    expect(within(card).getByText('Fecha y hora').nextElementSibling).toHaveTextContent('2020')
    expect(within(card).queryByText('Ubicación')).not.toBeInTheDocument()
    expect(within(card).getByRole('link', { name: 'Ver detalle de Actividad finalizada' })).toHaveAttribute('href', '/eventos/event-past')
  })

  it('shows cancelled status without changing its public detail route', () => {
    const cancelledEvent = { ...scheduledEvent, status: 'CANCELLED' }
    vi.mocked(usePublicEvents).mockReturnValue({ isPending: false, isError: false, data: [cancelledEvent] } as never)
    renderPage()
    const card = screen.getByRole('article')
    expect(within(card).getByText('Cancelado')).toHaveClass('bg-status-error-surface')
    expect(within(card).getByRole('link', { name: 'Ver detalle de Asamblea abierta' })).toHaveAttribute('href', '/eventos/event-1')
  })
})
