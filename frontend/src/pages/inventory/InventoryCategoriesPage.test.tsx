import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/shared/ui/Toast'
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

  it('hides unsupported category mutations', async () => {
    page()
    await screen.findByText('Herramientas')
    for (const action of ['Nueva categoría', 'Editar', 'Activar', 'Inactivar']) {
      expect(screen.queryByRole('button', { name: action })).not.toBeInTheDocument()
    }
    expect(inventoryCategoriesService.create).not.toHaveBeenCalled()
    expect(inventoryCategoriesService.update).not.toHaveBeenCalled()
    expect(inventoryCategoriesService.activate).not.toHaveBeenCalled()
    expect(inventoryCategoriesService.deactivate).not.toHaveBeenCalled()
  })
})
