import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '../../components/Toast'
import { inventoryCategoriesService } from '../../services/inventoryCategoriesService'
import { InventoryCategoriesPage } from './InventoryCategoriesPage'

vi.mock('../../services/inventoryCategoriesService', () => ({
  inventoryCategoriesService: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    activate: vi.fn(),
    deactivate: vi.fn(),
  },
}))

const category = { id: 1, name: 'Herramientas', description: 'Útiles de trabajo', isActive: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' } as const

const page = () =>
  render(
    <ToastProvider>
      <InventoryCategoriesPage />
    </ToastProvider>,
  )

describe('InventoryCategoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(inventoryCategoriesService.list).mockResolvedValue({ data: [category], total: 1, page: 1, limit: 10 })
  })

  it('lists categories', async () => {
    page()
    expect(await screen.findByText('Herramientas')).toBeInTheDocument()
    expect(screen.getByText('Útiles de trabajo')).toBeInTheDocument()
    expect(screen.getByText('Activa')).toBeInTheDocument()
  })

  it('creates a category', async () => {
    page()
    fireEvent.click(await screen.findByRole('button', { name: 'Nueva categoría' }))
    await screen.findByRole('dialog', { name: 'Nueva categoría' })
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ferretería' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(inventoryCategoriesService.create).toHaveBeenCalledWith({ name: 'Ferretería', description: undefined }))
    expect(await screen.findByText('Categoría creada correctamente.')).toBeInTheDocument()
  })

  it('edits a category', async () => {
    page()
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    await screen.findByRole('dialog', { name: 'Editar categoría' })
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Herramientas nuevas' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(inventoryCategoriesService.update).toHaveBeenCalledWith(1, { name: 'Herramientas nuevas', description: 'Útiles de trabajo' }))
  })

  it('activates and deactivates a category through confirmation', async () => {
    page()
    await screen.findByRole('button', { name: 'Inactivar' })
    fireEvent.click(screen.getByRole('button', { name: 'Inactivar' }))
    const dialog = await screen.findByRole('dialog', { name: 'Inactivar categoría' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Inactivar' }))
    await waitFor(() => expect(inventoryCategoriesService.deactivate).toHaveBeenCalledWith(1))

    const inactive = { ...category, isActive: false } as const
    vi.mocked(inventoryCategoriesService.list).mockResolvedValue({ data: [inactive], total: 1, page: 1, limit: 10 })
    page()
    fireEvent.click(await screen.findByRole('button', { name: 'Activar' }))
    const activateDialog = await screen.findByRole('dialog', { name: 'Activar categoría' })
    fireEvent.click(within(activateDialog).getByRole('button', { name: 'Activar' }))
    await waitFor(() => expect(inventoryCategoriesService.activate).toHaveBeenCalledWith(1))
  })
})