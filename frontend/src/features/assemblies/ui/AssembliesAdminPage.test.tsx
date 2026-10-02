import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AssembliesAdminPage } from './AssembliesAdminPage'
import { AssemblyManagementPage } from './AssemblyManagementPage'
import type { AssemblyDetail, EligibleAffiliate } from '../model/assemblies.types'

const hooks = vi.hoisted(() => ({
  useAssemblies: vi.fn(), useAssembly: vi.fn(), useEligibleAffiliates: vi.fn(),
  create: { mutateAsync: vi.fn(), isPending: false }, update: { mutateAsync: vi.fn(), isPending: false }, convocations: { mutateAsync: vi.fn(), isPending: false }, start: { mutateAsync: vi.fn(), isPending: false }, complete: { mutateAsync: vi.fn(), isPending: false }, remove: { mutateAsync: vi.fn(), isPending: false }, attendance: { mutateAsync: vi.fn(), isPending: false },
}))
const toast = vi.hoisted(() => ({ notify: vi.fn() }))
const auth = vi.hoisted(() => ({ permissionCodes: ['adm.assemblies.read', 'adm.assemblies.manage'] }))
vi.mock('../hooks/useAssembliesQueries', () => ({
  useAssemblies: hooks.useAssemblies, useAssembly: hooks.useAssembly, useEligibleAffiliates: hooks.useEligibleAffiliates,
  useAssemblyMutations: () => ({ create: hooks.create, update: hooks.update, convocations: hooks.convocations, start: hooks.start, complete: hooks.complete, remove: hooks.remove, attendance: hooks.attendance }),
}))
vi.mock('@/shared/ui/Toast', () => ({ useToast: () => toast }))
vi.mock('@/features/auth', () => ({ useAuth: () => ({ user: { permissionCodes: auth.permissionCodes } }) }))

const item = { id: 1, title: 'Asamblea general', type: null, date: '2026-09-20T18:00:00.000Z', place: 'Salón comunal', description: 'Informe anual', status: 'SCHEDULED', quorumType: 'PERCENTAGE', quorumValue: 50, convocationsLockedAt: null }
const person = { id: 3, affiliateId: 7, roleNameSnapshot: 'Fiscal', affiliate: { id: 7, fullName: 'Ana Pérez', status: 'ACTIVE' } }
const detail = { ...item, convocations: [person], quorum: { available: true, convokedCount: 1, presentCount: 0, quorumType: 'PERCENTAGE', quorumValue: 50, requiredCount: 1, quorumReached: false }, attendance: { present: 0, absent: 0, justified: 0, unrecorded: 1, data: [{ ...person, attendance: null }] } }
const eligibleAffiliates = [{ id: 1, fullName: 'Andrea Solano Méndez' }, { id: 2, fullName: 'José Olivier Pérez Picado' }] satisfies EligibleAffiliate[]
const legacyAssemblyDetail = {
  id: 1,
  title: 'Asamblea histórica',
  type: null,
  date: '2026-09-20T18:00:00.000Z',
  place: 'Salón comunal',
  description: null,
  status: 'SCHEDULED',
  quorumType: null,
  quorumValue: null,
  convocationsLockedAt: null,
  convocations: [],
  quorum: { available: false, reason: 'Historical assembly has no reliable convocation denominator', convokedCount: 0, presentCount: 0, requiredCount: null, quorumReached: null, quorumType: null, quorumValue: null },
  attendance: { present: 0, absent: 0, justified: 0, unrecorded: 0, data: [], quorum: { available: false, reason: 'Historical assembly has no reliable convocation denominator', convokedCount: 0, presentCount: 0, requiredCount: null, quorumReached: null, quorumType: null, quorumValue: null } },
} satisfies AssemblyDetail
const renderList = () => render(<MemoryRouter><AssembliesAdminPage /></MemoryRouter>)

describe('AssembliesAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    auth.permissionCodes = ['adm.assemblies.read', 'adm.assemblies.manage']
    hooks.useAssemblies.mockReturnValue({ isPending: false, data: [item] })
    hooks.useAssembly.mockReturnValue({ isPending: false, data: undefined })
    hooks.useEligibleAffiliates.mockReturnValue({ data: eligibleAffiliates })
    hooks.create.mutateAsync.mockResolvedValue(item)
    hooks.convocations.mutateAsync.mockResolvedValue([])
    hooks.start.mutateAsync.mockResolvedValue({})
    hooks.complete.mutateAsync.mockResolvedValue({})
    hooks.attendance.mutateAsync.mockResolvedValue({})
  })

  it.each([[{ isPending: true }, /Cargando asambleas/i], [{ isError: true, error: new Error('falló') }, /No fue posible cargar las asambleas/i], [{ data: [] }, /No hay asambleas registradas/i]])('renders list states', (state, label) => {
    hooks.useAssemblies.mockReturnValue({ isPending: false, ...state })
    renderList()
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('moves manage action to selected stable route without ErrorBoundary failure', async () => {
    function Location() { return <p data-testid="location">{useLocation().pathname}</p> }
    render(<MemoryRouter initialEntries={['/app/admin/assemblies']}><Routes><Route path="/app/admin/assemblies" element={<AssembliesAdminPage />} /><Route path="/app/admin/assemblies/:id" element={<AssemblyManagementPage />} /></Routes><Location /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Ver y gestionar' }))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/app/admin/assemblies/1'))
  })

  it('renders valid API detail on direct management link', () => {
    hooks.useAssembly.mockReturnValue({ isPending: false, data: detail })
    render(<MemoryRouter initialEntries={['/app/admin/assemblies/1']}><Routes><Route path="/app/admin/assemblies/:id" element={<AssemblyManagementPage />} /></Routes></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Asamblea general' })).toBeInTheDocument()
    expect(screen.getByText('Personas convocadas')).toBeInTheDocument()
  })

  it('renders Assembly 1 scheduled detail with real eligible-affiliates response shape without an ErrorBoundary fallback', () => {
    hooks.useAssembly.mockReturnValue({ isPending: false, data: detail })
    hooks.useEligibleAffiliates.mockReturnValue({ data: [{ id: 7, fullName: 'Ana Pérez' }] })
    render(<MemoryRouter initialEntries={['/app/admin/assemblies/1']}><Routes><Route path="/app/admin/assemblies/:id" element={<AssemblyManagementPage />} /></Routes></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Asamblea general' })).toBeInTheDocument()
    expect(screen.getByLabelText('Buscar persona')).toBeInTheDocument()
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument()
  })

  it('renders frozen Assembly 1 legacy payload without ErrorBoundary or TypeError', () => {
    hooks.useAssembly.mockReturnValue({ isPending: false, data: legacyAssemblyDetail })
    hooks.useEligibleAffiliates.mockReturnValue({ data: eligibleAffiliates })
    render(<MemoryRouter initialEntries={['/app/admin/assemblies/1']}><Routes><Route path="/app/admin/assemblies/:id" element={<AssemblyManagementPage />} /></Routes></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Asamblea histórica' })).toBeInTheDocument()
    expect(screen.getByLabelText('Buscar persona')).toBeInTheDocument()
    expect(screen.getByText('Cuórum no disponible')).toBeInTheDocument()
    expect(screen.getByText('Andrea Solano Méndez')).toBeInTheDocument()
    expect(screen.getByText('José Olivier Pérez Picado')).toBeInTheDocument()
  })

  it('keeps creation working and continues on saved assembly route', async () => {
    function Location() { return <p data-testid="location">{useLocation().pathname}</p> }
    render(<MemoryRouter initialEntries={['/app/admin/assemblies']}><Routes><Route path="/app/admin/assemblies" element={<AssembliesAdminPage />} /><Route path="/app/admin/assemblies/:id" element={<AssemblyManagementPage />} /></Routes><Location /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Crear asamblea' }))
    fireEvent.change(screen.getByLabelText('Título o motivo'), { target: { value: 'Nueva asamblea' } })
    fireEvent.change(screen.getByLabelText('Fecha y hora'), { target: { value: '2026-10-10T18:00' } })
    fireEvent.change(screen.getByLabelText('Lugar'), { target: { value: 'Casa comunal' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear y continuar' }))
    await waitFor(() => expect(hooks.create.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ quorumType: 'FIXED', quorumValue: 1 })))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/app/admin/assemblies/1'))
  })

  it('does not expose management controls without manage permission', () => {
    auth.permissionCodes = ['adm.assemblies.read']
    renderList()
    expect(screen.getByText(/Tiene acceso de consulta/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Crear asamblea' })).not.toBeInTheDocument()
  })

  it('shows scheduled manager controls and invokes convocation and start mutations', async () => {
    hooks.useAssembly.mockReturnValue({ isPending: false, data: detail })
    render(<MemoryRouter><AssembliesAdminPage assemblyId={1} /></MemoryRouter>)
    expect(screen.getByRole('button', { name: 'Editar datos' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Guardar 1 personas convocadas/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar asamblea' }))
    await waitFor(() => expect(hooks.convocations.mutateAsync).toHaveBeenCalledWith({ id: 1, affiliateIds: [7] }))
    await waitFor(() => expect(hooks.start.mutateAsync).toHaveBeenCalledWith(1))
    await waitFor(() => expect(toast.notify).toHaveBeenCalledWith('Personas convocadas guardadas correctamente.', 'success'))
    expect(toast.notify).toHaveBeenCalledWith('Asamblea iniciada correctamente.', 'success')
  })

  it('shows attendance and completion controls only to a manager', async () => {
    hooks.useAssembly.mockReturnValue({ isPending: false, data: { ...detail, status: 'IN_PROGRESS', attendance: { ...detail.attendance, unrecorded: 0, present: 1, data: [{ ...person, attendance: { id: 1, status: 'PRESENT' } }] } } })
    render(<MemoryRouter><AssembliesAdminPage assemblyId={1} /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Presente' }))
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar asamblea' }))
    await waitFor(() => expect(hooks.attendance.mutateAsync).toHaveBeenCalledWith({ id: 1, entries: [{ affiliateId: 7, status: 'PRESENT' }] }))
    await waitFor(() => expect(hooks.complete.mutateAsync).toHaveBeenCalledWith(1))
    expect(await screen.findByRole('status')).toHaveTextContent('Asistencia actualizada.')
    expect(toast.notify).toHaveBeenCalledWith('Asamblea finalizada correctamente.', 'success')
  })

  it('keeps scheduled and in-progress detail read-only without mutation controls', () => {
    auth.permissionCodes = ['adm.assemblies.read']
    hooks.useAssembly.mockReturnValue({ isPending: false, data: { ...detail, status: 'IN_PROGRESS' } })
    render(<MemoryRouter><AssembliesAdminPage assemblyId={1} /></MemoryRouter>)
    expect(screen.getByText('Personas convocadas')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar datos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Eliminar asamblea' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Guardar .*personas convocadas/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Iniciar asamblea' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Presente' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ausente' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Finalizar asamblea' })).not.toBeInTheDocument()
    expect(hooks.convocations.mutateAsync).not.toHaveBeenCalled()
    expect(hooks.start.mutateAsync).not.toHaveBeenCalled()
    expect(hooks.attendance.mutateAsync).not.toHaveBeenCalled()
    expect(hooks.complete.mutateAsync).not.toHaveBeenCalled()
  })

  it('shows scheduled convocations without selection or workflow actions to a read-only user', () => {
    auth.permissionCodes = ['adm.assemblies.read']
    hooks.useAssembly.mockReturnValue({ isPending: false, data: detail })
    render(<MemoryRouter><AssembliesAdminPage assemblyId={1} /></MemoryRouter>)
    expect(screen.getByText(/Rol al momento de la convocatoria: Fiscal/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Buscar persona')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Guardar .*personas convocadas/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Iniciar asamblea' })).not.toBeInTheDocument()
  })
})
