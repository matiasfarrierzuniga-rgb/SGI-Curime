import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/features/auth'
import { useToast } from '@/shared/ui/Toast'
import { useVenture, useVentureMutations, useVentures } from '../hooks/useVentures'
import { VenturesPage } from './VenturesPage'

vi.mock('@/features/auth', () => ({ useAuth: vi.fn() }))
vi.mock('@/shared/ui/Toast', () => ({ useToast: vi.fn() }))
vi.mock('../hooks/useVentures', () => ({ useVentures: vi.fn(), useVenture: vi.fn(), useVentureMutations: vi.fn() }))

const venture = { id: 1, name: 'Café Curime', description: null, offerDescription: null, businessPhone: null, businessEmail: null, websiteUrl: null, socialUrl: null, locationText: null, status: 'ACTIVE', publicationStatus: 'UNPUBLISHED', incorporatedAt: '2024-01-10T00:00:00.000Z', createdAt: '2024-01-10T00:00:00.000Z', updatedAt: '2024-01-10T00:00:00.000Z' }
const detailedVenture = { ...venture, description: 'Café de producción local.', offerDescription: 'Bebidas y repostería artesanal.', businessPhone: '+506 8888-1234', businessEmail: 'hola@cafecurime.cr', websiteUrl: 'https://cafecurime.cr', socialUrl: 'https://facebook.com/cafecurime', locationText: 'Curime, Nicoya' }
const refetch = vi.fn()

function ready(data = [venture], total = data.length, page = 1, detail = venture) {
  vi.mocked(useVentures).mockReturnValue({ isPending: false, isError: false, data: { data, total, page, limit: 20 }, refetch } as never)
  vi.mocked(useVenture).mockReturnValue({ isPending: false, isError: false, data: detail } as never)
}

describe('VenturesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({ user: { permissionCodes: ['ent.ventures.read', 'ent.ventures.create', 'ent.ventures.update'] } } as never)
    vi.mocked(useToast).mockReturnValue({ notify: vi.fn() } as never)
    vi.mocked(useVentureMutations).mockReturnValue({ create: { isPending: false, mutateAsync: vi.fn() }, update: { isPending: false, mutateAsync: vi.fn() }, publish: { isPending: false, mutateAsync: vi.fn() }, unpublish: { isPending: false, mutateAsync: vi.fn() } } as never)
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
    const detailDialog = screen.getByRole('dialog', { name: 'Detalle del emprendimiento' })
    fireEvent.click(within(detailDialog).getByRole('button', { name: 'Volver al directorio' }))
    expect(screen.queryByRole('dialog', { name: 'Detalle del emprendimiento' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tabla' }))
    expect(screen.getByRole('button', { name: 'Tabla' })).toHaveAttribute('aria-pressed', 'true')
    expect(vi.mocked(useVentures)).toHaveBeenLastCalledWith({ page: 1, limit: 20 })
    fireEvent.click(screen.getAllByRole('button', { name: 'Ver detalle' })[0])
    expect(useVenture).toHaveBeenLastCalledWith(1)
  })

  it('presents supported detail information, safe links, and an accessible return action', () => {
    ready([detailedVenture], 1, 1, detailedVenture)
    render(<VenturesPage />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Ver detalle' })[0])
    const detailDialog = screen.getByRole('dialog', { name: 'Detalle del emprendimiento' })
    expect(within(detailDialog).getByRole('button', { name: 'Volver al directorio' })).toBeInTheDocument()
    expect(within(detailDialog).getByText('Café de producción local.')).toBeInTheDocument()
    expect(within(detailDialog).getByText('Bebidas y repostería artesanal.')).toBeInTheDocument()
    expect(within(detailDialog).getByText('Curime, Nicoya')).toBeInTheDocument()
    expect(within(detailDialog).getByText('+506 8888-1234')).toBeInTheDocument()
    expect(within(detailDialog).getByRole('link', { name: 'hola@cafecurime.cr' })).toHaveAttribute('href', 'mailto:hola@cafecurime.cr')
    expect(within(detailDialog).getByRole('link', { name: /https:\/\/cafecurime.cr/ })).toHaveAttribute('href', 'https://cafecurime.cr/')
    expect(within(detailDialog).getByRole('link', { name: /https:\/\/facebook.com\/cafecurime/ })).toHaveAttribute('href', 'https://facebook.com/cafecurime')
    expect(within(detailDialog).getByRole('button', { name: 'Editar' }).closest('.modal-footer')).not.toBeNull()
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

  it('confirms publication only for authorized users and retires an existing publication', async () => {
    const publish = { isPending: false, mutateAsync: vi.fn().mockResolvedValue({ ...venture, publicationStatus: 'PUBLISHED' }) }
    const unpublish = { isPending: false, mutateAsync: vi.fn().mockResolvedValue({ ...venture, publicationStatus: 'UNPUBLISHED' }) }
    vi.mocked(useAuth).mockReturnValue({ user: { permissionCodes: ['ent.ventures.read', 'ent.ventures.publish'] } } as never)
    vi.mocked(useVentureMutations).mockReturnValue({ create: { isPending: false, mutateAsync: vi.fn() }, update: { isPending: false, mutateAsync: vi.fn() }, publish, unpublish } as never)
    const { rerender } = render(<VenturesPage />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Ver detalle' })[0])
    const publishAction = screen.getByRole('button', { name: 'Publicar' })
    expect(publishAction.closest('.modal-footer')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Volver al directorio' }).closest('.modal-footer')).not.toBeNull()
    fireEvent.click(publishAction)
    expect(screen.getByRole('dialog', { name: 'Publicar emprendimiento' })).toHaveTextContent('no crea ni habilita un directorio público')
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Publicar emprendimiento' })).getByRole('button', { name: 'Publicar' }))
    await waitFor(() => expect(publish.mutateAsync).toHaveBeenCalledWith(1))

    ready([venture], 1, 1, { ...venture, publicationStatus: 'PUBLISHED' })
    rerender(<VenturesPage />)
    const unpublishAction = screen.getByRole('button', { name: 'Retirar publicación' })
    expect(unpublishAction.closest('.modal-footer')).not.toBeNull()
    fireEvent.click(unpublishAction)
    expect(unpublish.mutateAsync).toHaveBeenCalledWith(1)
  })

  it('hides publication controls without capability and disables inactive publication', () => {
    const { rerender } = render(<VenturesPage />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Ver detalle' })[0])
    expect(screen.queryByRole('button', { name: 'Publicar' })).not.toBeInTheDocument()
    vi.mocked(useAuth).mockReturnValue({ user: { permissionCodes: ['ent.ventures.read', 'ent.ventures.publish'] } } as never)
    ready([venture], 1, 1, { ...venture, status: 'SUSPENDED' })
    rerender(<VenturesPage />)
    expect(screen.getByRole('button', { name: 'Publicar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Publicar' })).toHaveAttribute('title', 'Solo los emprendimientos activos pueden publicarse.')
  })

  it('shows publication loading and failure states without closing venture detail', async () => {
    const publish = { isPending: true, mutateAsync: vi.fn().mockRejectedValue(new Error('Servicio no disponible')) }
    vi.mocked(useAuth).mockReturnValue({ user: { permissionCodes: ['ent.ventures.read', 'ent.ventures.publish'] } } as never)
    vi.mocked(useVentureMutations).mockReturnValue({ create: { isPending: false, mutateAsync: vi.fn() }, update: { isPending: false, mutateAsync: vi.fn() }, publish, unpublish: { isPending: false, mutateAsync: vi.fn() } } as never)
    const { rerender } = render(<VenturesPage />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Ver detalle' })[0])
    expect(screen.getByRole('button', { name: 'Publicando…' })).toBeDisabled()

    publish.isPending = false
    rerender(<VenturesPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Publicar' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Publicar emprendimiento' })).getByRole('button', { name: 'Publicar' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No fue posible publicar'))
    expect(screen.getByRole('dialog', { name: 'Publicar emprendimiento' })).toBeInTheDocument()
  })
})
