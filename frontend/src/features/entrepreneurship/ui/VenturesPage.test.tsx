import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/features/auth'
import { useToast } from '@/shared/ui/Toast'
import { useVenture, useVentureMutations, useVentures } from '../hooks/useVentures'
import { VenturesPage } from './VenturesPage'

vi.mock('@/features/auth', () => ({ useAuth: vi.fn() }))
vi.mock('@/shared/ui/Toast', () => ({ useToast: vi.fn() }))
vi.mock('../hooks/useVentures', () => ({ useVentures: vi.fn(), useVenture: vi.fn(), useVentureMutations: vi.fn() }))

const venture = { id: 1, name: 'Café Curime', description: null, offerDescription: null, businessPhone: null, businessEmail: null, websiteUrl: null, socialUrl: null, locationText: null, status: 'ACTIVE', publicationStatus: 'UNPUBLISHED', incorporatedAt: '2024-01-10T00:00:00.000Z', createdAt: '2024-01-10T00:00:00.000Z', updatedAt: '2024-01-10T00:00:00.000Z' }
const refetch = vi.fn()

function ready(data = [venture], total = data.length, page = 1) {
  vi.mocked(useVentures).mockReturnValue({ isPending: false, isError: false, data: { data, total, page, limit: 20 }, refetch } as never)
  vi.mocked(useVenture).mockReturnValue({ isPending: false, isError: false, data: venture } as never)
}

describe('VenturesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({ user: { permissionCodes: ['ent.ventures.read', 'ent.ventures.create', 'ent.ventures.update'] } } as never)
    vi.mocked(useToast).mockReturnValue({ notify: vi.fn() } as never)
    vi.mocked(useVentureMutations).mockReturnValue({ create: { isPending: false, mutateAsync: vi.fn() }, update: { isPending: false, mutateAsync: vi.fn() } } as never)
    ready()
  })

  it('renders API-backed cards, total, translated state, and null optional values safely', () => {
    ready([venture], 24)
    render(<VenturesPage />)
    expect(screen.getByRole('heading', { name: 'Directorio de emprendimientos' })).toBeInTheDocument()
    expect(screen.getAllByText('Café Curime')).not.toHaveLength(0)
    expect(screen.getAllByText('Activo')).not.toHaveLength(0)
    expect(screen.getByText('24 emprendimientos encontrados')).toBeInTheDocument()
    const fallbackSummaries = screen.getAllByText('Sin descripción comercial registrada.')
    expect(fallbackSummaries).toHaveLength(2)
    fallbackSummaries.forEach(summary => expect(summary).toBeInTheDocument())
  })

  it('applies existing search and filters, resets pagination, and clears them', () => {
    ready([venture], 60, 2)
    render(<VenturesPage />)
    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'café' } })
    fireEvent.change(screen.getByLabelText('Estado institucional'), { target: { value: 'SUSPENDED' } })
    fireEvent.change(screen.getByLabelText('Publicación'), { target: { value: 'PUBLISHED' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(vi.mocked(useVentures)).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'café', status: 'SUSPENDED', publicationStatus: 'PUBLISHED', page: 1 }))
    fireEvent.click(screen.getByRole('button', { name: /Limpiar filtros/ }))
    expect(vi.mocked(useVentures)).toHaveBeenLastCalledWith({ page: 1, limit: 20 })
  })

  it('distinguishes empty registry from no matching filters and offers recovery', () => {
    ready([])
    const { rerender } = render(<VenturesPage />)
    expect(screen.getByText('No hay emprendimientos registrados')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'ausente' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    ready([])
    rerender(<VenturesPage />)
    expect(screen.getByText('No hay resultados para estos filtros')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Limpiar filtros' })).toBeInTheDocument()
  })

  it('switches directory views without changing filters and opens detail from each view', () => {
    render(<VenturesPage />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Ver detalle' })[0])
    expect(useVenture).toHaveBeenLastCalledWith(1)
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tabla' }))
    expect(screen.getByRole('button', { name: 'Tabla' })).toHaveAttribute('aria-pressed', 'true')
    expect(vi.mocked(useVentures)).toHaveBeenLastCalledWith({ page: 1, limit: 20 })
    fireEvent.click(screen.getAllByRole('button', { name: 'Ver detalle' })[0])
    expect(useVenture).toHaveBeenLastCalledWith(1)
  })

  it('keeps create and edit capability gated', () => {
    const { rerender } = render(<VenturesPage />)
    expect(screen.getByRole('button', { name: 'Registrar emprendimiento' })).toBeInTheDocument()
    vi.mocked(useAuth).mockReturnValue({ user: { permissionCodes: ['ent.ventures.read'] } } as never)
    rerender(<VenturesPage />)
    expect(screen.queryByRole('button', { name: 'Registrar emprendimiento' })).not.toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Ver detalle' })[0])
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
  })
})
