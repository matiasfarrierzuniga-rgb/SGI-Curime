import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/shared/ui/Toast'
import { inventoryCategoriesService } from '../../services/inventoryCategoriesService'
import { InventoryCategoriesPage } from './InventoryCategoriesPage'

const authState = vi.hoisted(() => ({ permissionCodes: [] as string[] }))

vi.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { permissionCodes: authState.permissionCodes } }),
}))

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
    authState.permissionCodes = ['inv.inventory.read']
    vi.mocked(inventoryCategoriesService.list).mockResolvedValue({ data: [category], total: 1, page: 1, limit: 10 })
  })

  it('lists categories', async () => {
    page()
    expect(await screen.findByText('Herramientas')).toBeInTheDocument()
    expect(screen.getByText('Útiles de trabajo')).toBeInTheDocument()
    expect(screen.getByText('Activa')).toBeInTheDocument()
  })

  it('keeps category mutations hidden for read-only users', async () => {
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

  it('shows category operations with inventory.item.manage', async () => {
    authState.permissionCodes = ['inv.inventory.read', 'inventory.item.manage']
    page()

    await screen.findByText('Herramientas')
    expect(screen.getByRole('button', { name: 'Nueva categoría' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Inactivar' })).toBeInTheDocument()
  })
})
