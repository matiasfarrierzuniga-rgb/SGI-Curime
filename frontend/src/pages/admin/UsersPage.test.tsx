import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/shared/ui/Toast'
import { usersService } from '../../services/usersService'
import { UsersPage } from './UsersPage'

vi.mock('../../services/usersService', () => ({
  usersService: {
    list: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    changeRole: vi.fn(),
    activate: vi.fn(),
    deactivate: vi.fn(),
    unlock: vi.fn(),
  },
}))

vi.mock('../../services/rolesService', () => ({
  rolesService: {
    listActive: vi.fn().mockResolvedValue([
      { id: 1, name: 'Usuario' },
      { id: 2, name: 'Administrador' },
    ]),
  },
}))

const user = {
  id: 1,
  fullName: 'Ana Pérez',
  email: 'ana@test.com',
  identification: '1',
  phone: '8',
  address: 'CR',
  status: 'ACTIVE',
  roleId: 1,
  role: { id: 1, name: 'Usuario', description: null, isActive: true },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  lockedAt: null,
  isBlocked: false,
  isTemporarilyLocked: true,
  isAdministrativelyBlocked: false,
} as const

const page = () =>
  render(
    <ToastProvider>
      <UsersPage />
    </ToastProvider>,
  )

const open = async () => {
  fireEvent.click(await screen.findByRole('button', { name: 'Ver detalle' }))
  await screen.findByRole('dialog', { name: /Usuario: Ana/ })
}

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usersService.list).mockResolvedValue({ data: [user], total: 1, page: 1, limit: 10 })
    vi.mocked(usersService.get).mockResolvedValue(user as never)
  })

  it('shows loading and empty state', async () => {
    let resolveList!: (response: { data: []; total: number; page: number; limit: number }) => void
    vi.mocked(usersService.list).mockReturnValueOnce(
      new Promise(response => {
        resolveList = response
      }),
    )

    page()
    expect(screen.getByText(/Cargando usuarios/)).toBeInTheDocument()
    resolveList({ data: [], total: 0, page: 1, limit: 10 })

    expect(await screen.findByText(/No hay usuarios/)).toBeInTheDocument()
  })

  it('shows errors from listing users', async () => {
    vi.mocked(usersService.list).mockRejectedValueOnce(new Error('x'))
    page()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('searches/filters and opens detail', async () => {
    page()
    await screen.findByText('Ana Pérez')

    fireEvent.change(screen.getByLabelText('Búsqueda por nombre'), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'ACTIVE' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))

    await waitFor(() =>
      expect(usersService.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ name: 'Ana', status: 'ACTIVE' }),
      ),
    )

    await open()
    expect(screen.getByText('Identificación')).toBeInTheDocument()
  })

  it.each([
    ['Editar datos', 'Guardar cambios', 'update'],
    ['Cambiar rol', 'Confirmar cambio', 'changeRole'],
    ['Inactivar', 'Inactivar cuenta', 'deactivate'],
    ['Desbloquear', 'Confirmar', 'unlock'],
  ])('runs %s and refreshes data', async (openLabel, confirmLabel, method) => {
    page()
    await open()
    fireEvent.click(screen.getByRole('button', { name: openLabel }))

    if (openLabel === 'Editar datos') {
      fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Ana Nueva' } })
    }

    if (openLabel === 'Cambiar rol') {
      fireEvent.change(screen.getAllByLabelText('Rol')[1], { target: { value: '2' } })
    }

    fireEvent.click(screen.getByRole('button', { name: confirmLabel }))
    await waitFor(() => expect((usersService as Record<string, unknown>)[method]).toHaveBeenCalled())
  })

  it('activates an inactive account', async () => {
    const inactive = { ...user, status: 'INACTIVE', isTemporarilyLocked: false } as const
    vi.mocked(usersService.list).mockResolvedValue({ data: [inactive], total: 1, page: 1, limit: 10 })
    vi.mocked(usersService.get).mockResolvedValue(inactive as never)

    page()
    await open()
    fireEvent.click(screen.getByRole('button', { name: 'Activar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(usersService.activate).toHaveBeenCalledWith(1))
  })
})
