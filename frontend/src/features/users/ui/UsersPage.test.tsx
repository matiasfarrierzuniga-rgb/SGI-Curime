import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/shared/ui/Toast'
import { usersService } from '../api/users.api'
import { UsersPage } from './UsersPage'

vi.mock('../api/users.api', () => ({
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

vi.mock('@/features/roles', () => ({
  rolesService: {
    listActive: vi.fn().mockResolvedValue([
      { id: 1, name: 'Usuario' },
      { id: 2, name: 'Administrador' },
    ]),
  },
}))

const personWithAccountAndAffiliation = {
  id: '101',
  personId: '101',
  fullName: 'Ana Pérez',
  person: { id: '101', contactEmail: 'ana.contacto@test.com' },
  identification: '1',
  identificationType: 'NATIONAL',
  phoneCountryCode: '+506',
  phoneNationalNumber: '80000000',
  phone: '8',
  address: 'CR',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  access: { id: 7, email: 'ana.cuenta@test.com', status: 'ACTIVE', subscriptionExpirationDate: null, lockedAt: null, roleId: 1, role: { id: 1, name: 'Administradora', description: null, isActive: true }, personId: '101', isBlocked: false, isTemporarilyLocked: false, isAdministrativelyBlocked: false },
  affiliate: { id: '44', status: 'ACTIVE', legacyRoleId: 999 },
  affiliateId: '44',
  actions: { read: true, update: false, changeRole: false, manageLifecycle: false, unlock: false },
} as const

const personWithAccount = { ...personWithAccountAndAffiliation, id: '102', personId: '102', fullName: 'Bruno Cuenta', person: { id: '102', contactEmail: null }, access: { ...personWithAccountAndAffiliation.access, id: 8, email: 'bruno.cuenta@test.com', personId: '102', role: { ...personWithAccountAndAffiliation.access.role, name: 'Usuario SGI' } }, affiliate: null, affiliateId: null } as const
const personWithAffiliation = { ...personWithAccountAndAffiliation, id: '103', personId: '103', fullName: 'Carla Afiliada', person: { id: '103', contactEmail: 'carla.contacto@test.com' }, access: null, affiliate: { id: '45', status: 'INACTIVE', legacyRoleId: 1 }, affiliateId: '45' } as const
const personOnly = { ...personWithAccountAndAffiliation, id: '104', personId: '104', fullName: 'Diego Persona', person: { id: '104', contactEmail: null }, access: null, affiliate: null, affiliateId: null } as const

const page = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return { queryClient, ...render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <UsersPage />
      </ToastProvider>
    </QueryClientProvider>,
  ) }
}

const open = async () => {
  fireEvent.click((await screen.findAllByRole('button', { name: 'Ver detalle' }))[0])
  await screen.findByRole('dialog', { name: /Persona: Ana/ })
}

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usersService.list).mockResolvedValue({ data: [personWithAccountAndAffiliation], total: 1, page: 1, limit: 10 })
    vi.mocked(usersService.get).mockResolvedValue(personWithAccountAndAffiliation as never)
    vi.mocked(usersService.update).mockResolvedValue({} as never)
    vi.mocked(usersService.changeRole).mockResolvedValue({} as never)
    vi.mocked(usersService.activate).mockResolvedValue({} as never)
    vi.mocked(usersService.deactivate).mockResolvedValue({} as never)
    vi.mocked(usersService.unlock).mockResolvedValue({} as never)
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

    expect(await screen.findByText(/No hay personas/)).toBeInTheDocument()
  })

  it('shows errors from listing users', async () => {
    vi.mocked(usersService.list).mockRejectedValueOnce(new Error('x'))
    page()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('renders Person-root rows with independent account and affiliation contexts', async () => {
    const inactiveAccount = { ...personWithAccount, access: { ...personWithAccount.access, status: 'INACTIVE' as const } }
    vi.mocked(usersService.list).mockResolvedValue({ data: [personWithAccountAndAffiliation, inactiveAccount, personWithAffiliation, personOnly] as never, total: 4, page: 1, limit: 10 })
    page()
    await screen.findByText('Ana Pérez')

    expect(screen.getByText('ana.contacto@test.com')).toBeInTheDocument()
    expect(screen.getByText('ana.cuenta@test.com')).toBeInTheDocument()
    expect(screen.getAllByText('Sin cuenta SGI')).toHaveLength(2)
    expect(screen.getByText('Afiliación inactiva')).toBeInTheDocument()
    expect(screen.getByText('Inactiva')).toBeInTheDocument()
    expect(screen.queryByText('Pendiente de activación')).not.toBeInTheDocument()
    expect(screen.getAllByText('Sin afiliación')).toHaveLength(2)
    expect(screen.queryByText('999')).not.toBeInTheDocument()
  })

  it('searches/filters and gets detail with Person ID', async () => {
    page()
    await screen.findByText('Ana Pérez')
    expect(screen.getByRole('search', { name: 'Buscar y filtrar usuarios' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Buscar por nombre'), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'ACTIVE' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))

    await waitFor(() =>
      expect(usersService.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ name: 'Ana', status: 'ACTIVE' }),
      ),
    )

    await open()
    expect(screen.getByText('Identificación')).toBeInTheDocument()
    expect(usersService.get).toHaveBeenCalledWith('101')
    expect(screen.getAllByText('ana.contacto@test.com')).toHaveLength(2)
    expect(screen.getAllByText('ana.cuenta@test.com')).toHaveLength(2)
  })

  it('renders uniform View, Edit, and More controls for arbitrary Person rows while guarding account operations', async () => {
    const fixtures = [personWithAccountAndAffiliation, personWithAccount, personWithAffiliation, personOnly]
    vi.mocked(usersService.list).mockResolvedValue({ data: fixtures as never, total: fixtures.length, page: 1, limit: 10 })
    page()

    await screen.findByText(personWithAccountAndAffiliation.fullName)
    const rows = screen.getAllByRole('row').slice(1)
    expect(rows).toHaveLength(fixtures.length)
    rows.forEach((row) => {
      expect(within(row).getByRole('button', { name: 'Ver detalle' })).toBeInTheDocument()
      expect(within(row).getByRole('button', { name: 'Editar' })).toBeInTheDocument()
      expect(within(row).getByRole('button', { name: /Más acciones para/ })).toBeInTheDocument()
    })

    const rowsWithoutAccess = rows.filter((_, index) => fixtures[index].access === null)
    expect(rowsWithoutAccess).toHaveLength(2)
    rowsWithoutAccess.forEach((row) => {
      const edit = within(row).getByRole('button', { name: 'Editar' })
      expect(edit).toBeDisabled()
      fireEvent.click(edit)
      fireEvent.click(within(row).getByRole('button', { name: /Más acciones para/ }))
      expect(screen.getByText('No hay acciones de cuenta disponibles para esta persona.')).toBeInTheDocument()
      expect(screen.queryAllByRole('menuitem')).toHaveLength(0)
    })

    expect(usersService.update).not.toHaveBeenCalled()
    expect(usersService.changeRole).not.toHaveBeenCalled()
    expect(usersService.activate).not.toHaveBeenCalled()
    expect(usersService.deactivate).not.toHaveBeenCalled()
    expect(usersService.unlock).not.toHaveBeenCalled()
  })

  it('opens role management from structured account actions without exposing unlock for an unlocked account', async () => {
    const managed = { ...personWithAccountAndAffiliation, actions: { read: true, update: false, changeRole: true, manageLifecycle: true, unlock: true } }
    vi.mocked(usersService.list).mockResolvedValue({ data: [managed] as never, total: 1, page: 1, limit: 10 })
    page()
    await screen.findByText('Ana Pérez')

    fireEvent.click(screen.getByRole('button', { name: 'Más acciones para Ana Pérez' }))
    expect(screen.getByRole('menu', { name: 'Acciones de cuenta para Ana Pérez' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Desbloquear cuenta' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Cambiar rol' }))

    expect(await screen.findByRole('dialog', { name: 'Cambiar rol de cuenta' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nuevo rol de cuenta')).toHaveValue('1')
  })

  it('uses numeric access ID for eligible profile edits and invalidates Person-root users cache', async () => {
    const editable = { ...personWithAccountAndAffiliation, actions: { ...personWithAccountAndAffiliation.actions, update: true } }
    vi.mocked(usersService.list).mockResolvedValue({ data: [editable] as never, total: 1, page: 1, limit: 10 })
    const { queryClient } = page()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    await screen.findByText('Ana Pérez')
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    fireEvent.change(screen.getByLabelText('Correo de cuenta SGI'), { target: { value: 'ana.nueva@test.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(usersService.update).toHaveBeenCalledWith(7, expect.objectContaining({ email: 'ana.nueva@test.com' })))
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users'] }))
    expect(await screen.findByText(/Cambios de cuenta SGI guardados/)).toBeInTheDocument()
  })

  it('uses action flags exactly and preserves dialog state when backend update fails', async () => {
    const managed = { ...personWithAccountAndAffiliation, actions: { read: true, update: false, changeRole: true, manageLifecycle: true, unlock: true } }
    vi.mocked(usersService.list).mockResolvedValue({ data: [managed] as never, total: 1, page: 1, limit: 10 })
    vi.mocked(usersService.deactivate).mockRejectedValue({ isAxiosError: true, response: { status: 400, data: { message: 'Cuenta protegida' } } })
    page()
    await screen.findByText('Ana Pérez')
    expect(screen.getByRole('button', { name: 'Editar' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Más acciones para Ana Pérez' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Desactivar cuenta' }))
    fireEvent.click(screen.getByRole('button', { name: 'Desactivar cuenta' }))

    await waitFor(() => expect(usersService.deactivate).toHaveBeenCalledWith(7))
    expect(await screen.findByRole('alert')).toHaveTextContent('Cuenta protegida')
    expect(screen.getByRole('dialog', { name: 'Desactivar cuenta SGI' })).toBeInTheDocument()
  })
})
