import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AssembliesAdminPage } from './AssembliesAdminPage'

const hooks = vi.hoisted(() => ({
  useAssemblies: vi.fn(), useAssembly: vi.fn(), useEligibleAffiliates: vi.fn(),
  create: { mutateAsync: vi.fn(), isPending: false }, update: { mutateAsync: vi.fn(), isPending: false },
  convocations: { mutateAsync: vi.fn(), isPending: false }, lock: { mutateAsync: vi.fn(), isPending: false },
  start: { mutateAsync: vi.fn(), isPending: false }, complete: { mutateAsync: vi.fn(), isPending: false },
  remove: { mutateAsync: vi.fn(), isPending: false }, attendance: { mutateAsync: vi.fn(), isPending: false },
}))
vi.mock('../hooks/useAssembliesQueries', () => ({
  useAssemblies: hooks.useAssemblies,
  useAssembly: hooks.useAssembly,
  useEligibleAffiliates: hooks.useEligibleAffiliates,
  useAssemblyMutations: () => ({ create: hooks.create, update: hooks.update, convocations: hooks.convocations, start: hooks.start, complete: hooks.complete, remove: hooks.remove, attendance: hooks.attendance }),
}))
vi.mock('@/shared/ui/Toast', () => ({ useToast: () => ({ notify: vi.fn() }) }))

const item = { id: 1, title: 'Asamblea general', type: null, date: '2026-09-20T18:00:00.000Z', place: 'Salón comunal', description: 'Informe anual', status: 'SCHEDULED', quorumType: 'PERCENTAGE', quorumValue: 50, convocationsLockedAt: null }
const person = { id: 3, affiliateId: 7, roleNameSnapshot: 'Fiscal', affiliate: { id: 7, fullName: 'Ana Pérez', status: 'ACTIVE' } }
const detail = { ...item, convocations: [person], quorum: { available: true, convokedCount: 1, presentCount: 0, quorumType: 'PERCENTAGE', quorumValue: 50, requiredCount: 1, quorumReached: false }, attendance: { present: 0, absent: 0, justified: 0, unrecorded: 1, data: [{ ...person, attendance: null }] } }

describe('AssembliesAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hooks.useAssemblies.mockReturnValue({ isPending: false, data: [item] })
    hooks.useAssembly.mockReturnValue({ isPending: false, data: undefined })
    hooks.useEligibleAffiliates.mockReturnValue({ data: [{ id: 7, fullName: 'Ana Pérez', role: { id: 3, name: 'Fiscal' } }] })
    hooks.create.mutateAsync.mockResolvedValue(item)
    hooks.update.mutateAsync.mockResolvedValue(item)
    hooks.convocations.mutateAsync.mockResolvedValue([])
    hooks.start.mutateAsync.mockResolvedValue({})
    hooks.complete.mutateAsync.mockResolvedValue({})
    hooks.remove.mutateAsync.mockResolvedValue({})
    hooks.attendance.mutateAsync.mockResolvedValue({})
  })

  it.each([
    [{ isPending: true }, /Cargando asambleas/i],
    [{ isError: true, error: new Error('sin conexión') }, /No fue posible cargar las asambleas/i],
    [{ data: [] }, /No hay asambleas registradas/i],
  ])('renders list state', (state, text) => {
    hooks.useAssemblies.mockReturnValue({ isPending: false, ...state })
    render(<AssembliesAdminPage />)
    expect(screen.getByText(text)).toBeInTheDocument()
  })

  it('lists assemblies with Spanish quorum terminology', () => {
    render(<AssembliesAdminPage />)
    expect(screen.getByText('Asamblea general')).toBeInTheDocument()
    expect(screen.getByText(/Cuórum: 50%/)).toBeInTheDocument()
  })

  it('creates with fixed quorum', async () => {
    render(<AssembliesAdminPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Crear asamblea' }))
    fireEvent.change(screen.getByLabelText('Título o motivo'), { target: { value: 'Nueva asamblea' } })
    fireEvent.change(screen.getByLabelText('Fecha y hora'), { target: { value: '2026-10-10T18:00' } })
    fireEvent.change(screen.getByLabelText('Lugar'), { target: { value: 'Casa comunal' } })
    expect(screen.getByRole('option', { name: 'Cantidad fija' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Cantidad mínima de personas'), { target: { value: '12' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear y continuar' }))
    await waitFor(() => expect(hooks.create.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ quorumType: 'FIXED', quorumValue: 12 })))
  })

  it('creates with percentage quorum', async () => {
    render(<AssembliesAdminPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Crear asamblea' }))
    fireEvent.change(screen.getByLabelText('Título o motivo'), { target: { value: 'Nueva asamblea' } })
    fireEvent.change(screen.getByLabelText('Fecha y hora'), { target: { value: '2026-10-10T18:00' } })
    fireEvent.change(screen.getByLabelText('Lugar'), { target: { value: 'Casa comunal' } })
    fireEvent.change(screen.getByLabelText('Modalidad del cuórum'), { target: { value: 'PERCENTAGE' } })
    expect(screen.getByRole('option', { name: 'Porcentaje' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Porcentaje mínimo'), { target: { value: '50' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear y continuar' }))
    await waitFor(() => expect(hooks.create.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ quorumType: 'PERCENTAGE', quorumValue: 50 })))
  })

  it('shows inline validation and preserves the form', () => {
    render(<AssembliesAdminPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Crear asamblea' }))
    fireEvent.click(screen.getByRole('button', { name: 'Crear y continuar' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/Complete el título/)
    expect(screen.getByLabelText('Título o motivo')).toHaveValue('')
  })

  it('validates percentage range inline without submitting', () => {
    render(<AssembliesAdminPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Crear asamblea' }))
    fireEvent.change(screen.getByLabelText('Título o motivo'), { target: { value: 'Nueva' } })
    fireEvent.change(screen.getByLabelText('Fecha y hora'), { target: { value: '2026-10-10T18:00' } })
    fireEvent.change(screen.getByLabelText('Lugar'), { target: { value: 'Salón' } })
    fireEvent.change(screen.getByLabelText('Modalidad del cuórum'), { target: { value: 'PERCENTAGE' } })
    fireEvent.change(screen.getByLabelText('Porcentaje mínimo'), { target: { value: '101' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear y continuar' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/entre 1 y 100/)
    expect(hooks.create.mutateAsync).not.toHaveBeenCalled()
  })

  it('shows detail, quorum, eligible roles and saves selected convocations', async () => {
    hooks.useAssembly.mockReturnValue({ isPending: false, data: detail })
    render(<AssembliesAdminPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver y gestionar' }))
    expect(screen.getByText(/Pendiente de asistencia/)).toBeInTheDocument()
    expect(screen.getByText(/Rol actual: Fiscal/)).toBeInTheDocument()
    expect(screen.getByText('Personas convocadas')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Guardar 1 personas convocadas/ }))
    await waitFor(() => expect(hooks.convocations.mutateAsync).toHaveBeenCalledWith({ id: 1, affiliateIds: [7] }))
  })

  it('shows an in-progress attendance sheet, progress and controls', async () => {
    hooks.useAssembly.mockReturnValue({ isPending: false, data: { ...detail, status: 'IN_PROGRESS', convocationsLockedAt: '2026-09-20T18:00:00Z' } })
    render(<AssembliesAdminPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver y gestionar' }))
    expect(screen.getByText(/0 de 1 asistencias registradas/)).toBeInTheDocument()
    expect(screen.getByText(/Cuórum no alcanzado/)).toBeInTheDocument()
    expect(screen.getByText(/Rol al momento de la convocatoria: Fiscal/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Presente' }))
    await waitFor(() => expect(hooks.attendance.mutateAsync).toHaveBeenCalledWith({ id: 1, entries: [{ affiliateId: 7, status: 'PRESENT' }] }))
    expect(screen.getByRole('button', { name: 'Finalizar asamblea' })).toBeDisabled()
  })

  it('starts a scheduled assembly', async () => {
    hooks.useAssembly.mockReturnValue({ isPending: false, data: detail })
    render(<AssembliesAdminPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver y gestionar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar asamblea' }))
    await waitFor(() => expect(hooks.start.mutateAsync).toHaveBeenCalledWith(1))
  })

  it('confirms deletion before removing an eligible assembly', async () => {
    hooks.useAssembly.mockReturnValue({ isPending: false, data: detail })
    render(<AssembliesAdminPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver y gestionar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar asamblea' }))
    expect(screen.getByText(/eliminará también su lista de personas convocadas/)).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Eliminar asamblea' }).at(-1)!)
    await waitFor(() => expect(hooks.remove.mutateAsync).toHaveBeenCalledWith(1))
  })

  it('allows completion only when attendance is complete', async () => {
    hooks.useAssembly.mockReturnValue({ isPending: false, data: { ...detail, status: 'IN_PROGRESS', attendance: { ...detail.attendance, unrecorded: 0, present: 1, data: [{ ...person, attendance: { id: 1, status: 'PRESENT' } }] }, quorum: { ...detail.quorum, presentCount: 1, quorumReached: true } } })
    render(<AssembliesAdminPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver y gestionar' }))
    expect(screen.getByText(/Cuórum alcanzado/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar asamblea' }))
    await waitFor(() => expect(hooks.complete.mutateAsync).toHaveBeenCalledWith(1))
  })
})
