import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { usePublicVentures } from '../hooks/usePublicVentures'
import { PublicVenturesPage } from './PublicVenturesPage'

vi.mock('../hooks/usePublicVentures', () => ({ usePublicVentures: vi.fn() }))

const venture = { id: 7, name: 'Café Curime', description: 'Café de producción local.', offerDescription: null, businessPhone: null, businessEmail: null, websiteUrl: null, socialUrl: null, locationText: 'Curime, Nicoya' }

describe('PublicVenturesPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders only public venture fields and links to numeric detail route', () => {
    vi.mocked(usePublicVentures).mockReturnValue({ isPending: false, isError: false, data: { data: [venture], total: 1, page: 1, limit: 12 } } as never)

    render(<MemoryRouter><PublicVenturesPage /></MemoryRouter>)

    expect(screen.getByRole('navigation', { name: 'Ruta de navegación' })).toHaveTextContent('Emprendimientos')
    expect(screen.getByRole('heading', { name: 'Emprendimientos', level: 1 })).toHaveClass('text-heading-1')
    expect(screen.getByRole('heading', { name: 'Emprendimientos', level: 1 })).not.toHaveClass('whitespace-nowrap')
    expect(screen.getByRole('search').closest('section')).toHaveClass('public-section')
    expect(screen.getByRole('search')).toHaveClass('w-full', 'min-w-0', 'sm:flex-row')
    const ventureHeading = screen.getByRole('heading', { name: 'Café Curime' })
    expect(ventureHeading).toHaveClass('text-heading-3')
    const card = ventureHeading.closest('article')!
    expect(card).toHaveClass('h-full', 'min-w-0', 'rounded-surface', 'flex-col', 'p-5')
    expect(card.parentElement).toHaveClass('grid', 'min-w-0', 'md:grid-cols-2', 'xl:grid-cols-3')
    expect(within(card).getByText('Café de producción local.')).toHaveClass('text-pretty', 'leading-relaxed')
    expect(screen.getByText('Curime, Nicoya')).toBeInTheDocument()
    expect(within(card).getAllByRole('link')).toHaveLength(2)
    expect(screen.getByRole('link', { name: /ver detalle de café curime/i })).toHaveAttribute('href', '/ventures/7')
  })

  it('shows a shared loading state without venture cards', () => {
    vi.mocked(usePublicVentures).mockReturnValue({ isPending: true, isError: false } as never)

    render(<MemoryRouter><PublicVenturesPage /></MemoryRouter>)

    expect(screen.getByRole('status')).toHaveTextContent('Cargando emprendimientos publicados')
    expect(screen.getByRole('status')).toHaveClass('rounded-surface', 'border', 'bg-surface-card')
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Paginación de emprendimientos' })).not.toBeInTheDocument()
  })

  it('shows the shared empty state without sample ventures', () => {
    vi.mocked(usePublicVentures).mockReturnValue({ isPending: false, isError: false, data: { data: [], total: 0, page: 1, limit: 12 } } as never)

    render(<MemoryRouter><PublicVenturesPage /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: 'No hay emprendimientos publicados en este momento' })).toBeVisible()
    expect(screen.getByText('Cuando la Asociación publique un emprendimiento, aparecerá en este directorio.')).toBeVisible()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Paginación de emprendimientos' })).not.toBeInTheDocument()
  })

  it('submits search from the public contract and can clear it', () => {
    vi.mocked(usePublicVentures).mockReturnValue({ isPending: false, isError: false, data: { data: [], total: 0, page: 1, limit: 12 } } as never)

    render(<MemoryRouter><PublicVenturesPage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Buscar emprendimientos'), { target: { value: 'café' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(usePublicVentures).toHaveBeenLastCalledWith({ search: 'café', page: 1, limit: 12 })
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }))
    expect(usePublicVentures).toHaveBeenLastCalledWith({ page: 1, limit: 12 })
  })

  it('requests the next page of published ventures without changing the public route', () => {
    vi.mocked(usePublicVentures).mockReturnValue({ isPending: false, isError: false, data: { data: [venture], total: 13, page: 1, limit: 12 } } as never)

    render(<MemoryRouter><PublicVenturesPage /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(usePublicVentures).toHaveBeenLastCalledWith({ page: 2, limit: 12 })
    expect(screen.getByRole('link', { name: /ver detalle de café curime/i })).toHaveAttribute('href', '/ventures/7')
  })

  it('shows a retryable error without static fallback ventures', () => {
    const refetch = vi.fn()
    vi.mocked(usePublicVentures).mockReturnValue({ isPending: false, isError: true, error: new Error('offline'), refetch } as never)

    render(<MemoryRouter><PublicVenturesPage /></MemoryRouter>)

    expect(screen.getByText(/No fue posible cargar los emprendimientos publicados/i)).toBeInTheDocument()
    expect(screen.queryByText('Café Curime')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(refetch).toHaveBeenCalledOnce()
  })
})
