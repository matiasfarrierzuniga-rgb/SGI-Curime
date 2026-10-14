import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useVentures } from '../hooks/useVentures'
import { VenturesSummaryPage } from './VenturesSummaryPage'

vi.mock('../hooks/useVentures', () => ({ useVentures: vi.fn() }))

const refetch = vi.fn()
const page = (total: number) => ({ isPending: false, isError: false, data: { data: [], total, page: 1, limit: 1 }, refetch })
const renderPage = () => render(<MemoryRouter><VenturesSummaryPage /></MemoryRouter>)

function ready(totals = [24, 18, 20, 3, 1]) {
  vi.mocked(useVentures).mockImplementation((filters) => {
    if (filters.status === 'ACTIVE' && filters.publicationStatus === 'PUBLISHED') return page(totals[1]) as never
    if (filters.status === 'ACTIVE') return page(totals[2]) as never
    if (filters.status === 'SUSPENDED') return page(totals[3]) as never
    if (filters.status === 'CLOSED') return page(totals[4]) as never
    return page(totals[0]) as never
  })
}

describe('VenturesSummaryPage', () => {
  beforeEach(() => { vi.clearAllMocks(); ready() })

  it('uses API totals rather than page rows and does not invent category or recent data', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Emprendimientos' })).toBeInTheDocument()
    expect(screen.getByText('24')).toBeInTheDocument()
    expect(screen.getByText('18')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.queryByText(/Últimos emprendimientos/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Emprendimientos por categoría/i)).not.toBeInTheDocument()
  })

  it('sends search, status, publication, and summary pagination to the API-backed queries', () => {
    renderPage()
    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'café' } })
    fireEvent.change(screen.getByLabelText('Estado institucional'), { target: { value: 'SUSPENDED' } })
    fireEvent.change(screen.getByLabelText('Publicación'), { target: { value: 'PUBLISHED' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(vi.mocked(useVentures)).toHaveBeenCalledWith({ page: 1, limit: 1, search: 'café', status: 'SUSPENDED', publicationStatus: 'PUBLISHED' })
    expect(vi.mocked(useVentures)).toHaveBeenCalledWith({ page: 1, limit: 1, search: 'café', status: 'ACTIVE', publicationStatus: 'PUBLISHED' })
  })

  it('renders loading, error with retry, and empty states', () => {
    vi.mocked(useVentures).mockReturnValue({ isPending: true, isError: false } as never)
    const { rerender } = render(<MemoryRouter><VenturesSummaryPage /></MemoryRouter>)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando resumen de emprendimientos...')

    vi.mocked(useVentures).mockReturnValue({ isPending: false, isError: true, error: new Error('fallo'), refetch } as never)
    rerender(<MemoryRouter><VenturesSummaryPage /></MemoryRouter>)
    expect(screen.getByRole('alert')).toHaveTextContent('No fue posible cargar el resumen')
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(refetch).toHaveBeenCalledTimes(5)

    ready([0, 0, 0, 0, 0])
    rerender(<MemoryRouter><VenturesSummaryPage /></MemoryRouter>)
    expect(screen.getByText('No hay emprendimientos registrados')).toBeInTheDocument()
  })

  it('provides directory navigation', () => {
    renderPage()
    expect(screen.getByRole('link', { name: 'Ver directorio' })).toHaveAttribute('href', '/app/admin/ventures')
  })
})
