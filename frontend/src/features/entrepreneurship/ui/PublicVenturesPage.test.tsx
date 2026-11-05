import { fireEvent, render, screen } from '@testing-library/react'
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

    expect(screen.getByRole('heading', { name: 'Café Curime' })).toBeInTheDocument()
    expect(screen.getByText('Curime, Nicoya')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver detalle de café curime/i })).toHaveAttribute('href', '/ventures/7')
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
    vi.mocked(usePublicVentures).mockReturnValue({ isPending: false, isError: true, error: new Error('offline'), refetch: vi.fn() } as never)

    render(<MemoryRouter><PublicVenturesPage /></MemoryRouter>)

    expect(screen.getByText(/No fue posible cargar los emprendimientos publicados/i)).toBeInTheDocument()
    expect(screen.queryByText('Café Curime')).not.toBeInTheDocument()
  })
})
