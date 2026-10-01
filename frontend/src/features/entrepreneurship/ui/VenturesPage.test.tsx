import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/features/auth'
import { useToast } from '@/shared/ui/Toast'
import { useVenture, useVentureMutations, useVentures } from '../hooks/useVentures'
import { VentureForm } from './VentureForm'
import { VenturesPage } from './VenturesPage'

vi.mock('@/features/auth', () => ({ useAuth: vi.fn() }))
vi.mock('@/shared/ui/Toast', () => ({ useToast: vi.fn() }))
vi.mock('../hooks/useVentures', () => ({ useVentures: vi.fn(), useVenture: vi.fn(), useVentureMutations: vi.fn() }))

const venture = { id: 1, name: 'Café Curime', description: null, offerDescription: null, businessPhone: null, businessEmail: null, websiteUrl: null, socialUrl: null, locationText: null, status: 'ACTIVE', publicationStatus: 'UNPUBLISHED', incorporatedAt: '2024-01-10T00:00:00.000Z', createdAt: '2024-01-10T00:00:00.000Z', updatedAt: '2024-01-10T00:00:00.000Z' }
const refetch = vi.fn()
const notify = vi.fn()
const create = { isPending: false, mutateAsync: vi.fn().mockResolvedValue(venture) }
const update = { isPending: false, mutateAsync: vi.fn().mockResolvedValue(venture) }

function ready(data = [venture]) {
  vi.mocked(useVentures).mockReturnValue({ isPending: false, isError: false, data: { data, total: data.length, page: 1, limit: 20 }, refetch } as never)
  vi.mocked(useVenture).mockReturnValue({ isPending: false, isError: false, data: venture } as never)
}

describe('VenturesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({ user: { permissionCodes: ['ent.ventures.read', 'ent.ventures.create', 'ent.ventures.update'] } } as never)
    vi.mocked(useToast).mockReturnValue({ notify } as never)
    vi.mocked(useVentureMutations).mockReturnValue({ create, update } as never)
    ready()
  })

  it('renders list, translated state, and null optional values safely', () => {
    render(<VenturesPage />)
    expect(screen.getAllByText('Café Curime')).not.toHaveLength(0)
    expect(screen.getAllByText('Activo')).not.toHaveLength(0)
    expect(screen.getAllByText('No publicado')).not.toHaveLength(0)
    expect(screen.getAllByText('Sin ubicación registrada')).not.toHaveLength(0)
  })

  it('renders empty and error states', () => {
    ready([])
    const { rerender } = render(<VenturesPage />)
    expect(screen.getByText('No hay emprendimientos registrados')).toBeInTheDocument()
    vi.mocked(useVentures).mockReturnValue({ isPending: false, isError: true, error: new Error('falló'), refetch } as never)
    rerender(<VenturesPage />)
    expect(screen.getByText('No fue posible cargar los emprendimientos')).toBeInTheDocument()
  })

  it('sends search and filters to list query', () => {
    render(<VenturesPage />)
    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'café' } })
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'SUSPENDED' } })
    fireEvent.change(screen.getByLabelText('Publicación'), { target: { value: 'PUBLISHED' } })
    expect(vi.mocked(useVentures)).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'café', status: 'SUSPENDED', publicationStatus: 'PUBLISHED', page: 1 }))
  })

  it('resets pagination when filters change or clear', () => {
    vi.mocked(useVentures).mockReturnValue({ isPending: false, isError: false, data: { data: [venture], total: 60, page: 2, limit: 20 }, refetch } as never)
    render(<VenturesPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(vi.mocked(useVentures)).toHaveBeenLastCalledWith(expect.objectContaining({ page: 3 }))

    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'postre' } })
    expect(vi.mocked(useVentures)).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'postre', page: 1 }))

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'ACTIVE' } })
    fireEvent.change(screen.getByLabelText('Publicación'), { target: { value: 'PUBLISHED' } })
    expect(vi.mocked(useVentures)).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'postre', status: 'ACTIVE', publicationStatus: 'PUBLISHED', page: 1 }))

    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Publicación'), { target: { value: '' } })
    expect(vi.mocked(useVentures)).toHaveBeenLastCalledWith(expect.objectContaining({ search: '', status: undefined, publicationStatus: undefined, page: 1, limit: 20 }))
  })

  it('opens read detail and only displays edit for update capability', () => {
    const { rerender } = render(<VenturesPage />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Ver detalle' })[0])
    expect(useVenture).toHaveBeenLastCalledWith(1)
    expect(screen.getByRole('heading', { name: 'Detalle del emprendimiento' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'Administrador', permissionCodes: ['ent.ventures.read'] } } as never)
    rerender(<VenturesPage />)
    expect(screen.queryByRole('button', { name: 'Registrar emprendimiento' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
  })

  it('submits create and update mutations with confirmed fields only', async () => {
    const close = vi.fn(); const success = vi.fn()
    const { unmount } = render(<VentureForm onClose={close} onSuccess={success} />)
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Nueva empresa' } })
    fireEvent.change(screen.getByLabelText(/Fecha de incorporación/), { target: { value: '2025-02-03' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Registrar emprendimiento' }).closest('form')!)
    await waitFor(() => expect(create.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ name: 'Nueva empresa', incorporatedAt: expect.stringContaining('2025-02-03') })))
    expect(success).toHaveBeenCalledWith(false)
    unmount()
    render(<VentureForm venture={venture} onClose={close} onSuccess={success} />)
    fireEvent.submit(screen.getByRole('button', { name: 'Guardar cambios' }).closest('form')!)
    await waitFor(() => expect(update.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ id: 1, input: expect.objectContaining({ name: 'Café Curime' }) })))
    expect(success).toHaveBeenCalledWith(true)
  })
})
