import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/shared/ui/Toast'
import { usersService } from '../api/users.api'
import { UsersPage } from './UsersPage'

vi.mock('../api/users.api', () => ({
  usersService: {
    list: vi.fn(),
    get: vi.fn(),
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
  id: 101,
  personId: 101,
  fullName: 'Ana Pérez',
  person: { id: 101, contactEmail: 'ana.contacto@test.com' },
  identification: '1',
  identificationType: 'NATIONAL',
  phoneCountryCode: '+506',
  phoneNationalNumber: '80000000',
  phone: '8',
  address: 'CR',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  access: { id: 7, email: 'ana.cuenta@test.com', status: 'ACTIVE', lockedAt: null, roleId: 1, role: { id: 1, name: 'Administradora', description: null, isActive: true }, isBlocked: false, isTemporarilyLocked: false, isAdministrativelyBlocked: false },
  affiliate: { id: 44, status: 'ACTIVE', legacyRoleId: 999 },
  affiliateId: 44,
  actions: { read: true },
} as const

const personWithAccount = { ...personWithAccountAndAffiliation, id: 102, personId: 102, fullName: 'Bruno Cuenta', person: { id: 102, contactEmail: null }, access: { ...personWithAccountAndAffiliation.access, id: 8, email: 'bruno.cuenta@test.com', role: { ...personWithAccountAndAffiliation.access.role, name: 'Usuario SGI' } }, affiliate: null, affiliateId: null } as const
const personWithAffiliation = { ...personWithAccountAndAffiliation, id: 103, personId: 103, fullName: 'Carla Afiliada', person: { id: 103, contactEmail: 'carla.contacto@test.com' }, access: null, affiliate: { id: 45, status: 'INACTIVE', legacyRoleId: 1 }, affiliateId: 45 } as const
const personOnly = { ...personWithAccountAndAffiliation, id: 104, personId: 104, fullName: 'Diego Persona', person: { id: 104, contactEmail: null }, access: null, affiliate: null, affiliateId: null } as const

const page = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <UsersPage />
      </ToastProvider>
    </QueryClientProvider>,
  )
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
    vi.mocked(usersService.list).mockResolvedValue({ data: [personWithAccountAndAffiliation, personWithAccount, personWithAffiliation, personOnly] as never, total: 4, page: 1, limit: 10 })
    page()
    await screen.findByText('Ana Pérez')

    expect(screen.getByText('ana.contacto@test.com')).toBeInTheDocument()
    expect(screen.getByText('ana.cuenta@test.com')).toBeInTheDocument()
    expect(screen.getAllByText('Sin cuenta SGI')).toHaveLength(2)
    expect(screen.getByText('Afiliación inactiva')).toBeInTheDocument()
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
    expect(usersService.get).toHaveBeenCalledWith(101)
    expect(screen.getAllByText('ana.contacto@test.com')).toHaveLength(2)
    expect(screen.getAllByText('ana.cuenta@test.com')).toHaveLength(2)
  })

  it('hides every write action because read contract exposes no write capability', async () => {
    page()
    await open()
    expect(screen.getByText(/Solo consulta. No hay acciones de escritura disponibles/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Editar|Cambiar rol|Activar|Inactivar|Desbloquear/ })).not.toBeInTheDocument()
  })
})
