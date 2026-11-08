import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/shared/ui/Toast'
import { InstitutionalBoardPage } from './InstitutionalBoardPage'

const createTerm = vi.fn().mockResolvedValue({})
const createAppointment = vi.fn().mockResolvedValue({})
const updateAppointment = vi.fn().mockResolvedValue({})
const replaceAppointment = vi.fn().mockResolvedValue({})
const revokeAppointment = vi.fn().mockResolvedValue({})
const updateTerm = vi.fn().mockResolvedValue({})
let permissionCodes = ['adm.institutional-board.manage']

vi.mock('@/features/auth', () => ({ useAuth: () => ({ user: { permissionCodes } }) }))
vi.mock('../hooks/institutionalBoard.queries', () => ({
  useBoardTerms: () => ({ data: [{ id: 1, startsOn: '2026-01-01', endsOn: '2027-12-31', appointments: [{ id: 2, boardTermId: 1, personId: 8, position: 'PRESIDENT', seatNumber: null, startsOn: null, endsOn: null, person: { id: 8, firstName: 'Persona', firstSurname: 'Ficticia', secondSurname: null, legacyFullName: null } }] }], isPending: false, isError: false }),
  usePersonCandidates: () => ({ data: [{ id: 9, displayName: 'Otra Persona', identificationType: 'NATIONAL', identificationHint: '••••0001' }] }),
  useBoardMutations: () => ({ createTerm: { mutateAsync: createTerm, isPending: false }, updateTerm: { mutateAsync: updateTerm, isPending: false }, createAppointment: { mutateAsync: createAppointment, isPending: false }, updateAppointment: { mutateAsync: updateAppointment, isPending: false }, replaceAppointment: { mutateAsync: replaceAppointment, isPending: false }, revokeAppointment: { mutateAsync: revokeAppointment, isPending: false } }),
}))

const page = () => render(<ToastProvider><InstitutionalBoardPage /></ToastProvider>)

describe('InstitutionalBoardPage', () => {
  beforeEach(() => { vi.clearAllMocks(); revokeAppointment.mockResolvedValue({}); permissionCodes = ['adm.institutional-board.manage'] })

  it('shows periods, appointments, position labels and only supported actions', () => {
    page()
    expect(screen.getByRole('heading', { name: 'Junta Directiva' })).toBeInTheDocument()
    expect(screen.getAllByText('Presidencia')).not.toHaveLength(0)
    expect(screen.getByText('Persona Ficticia')).toBeInTheDocument()
    expect(screen.getAllByText(/No especificada/)).not.toHaveLength(0)
    expect(screen.queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/DINADECO|sello|sustitución|actas/i)).not.toBeInTheDocument()
  })

  it('uses the person selector on create and sends personId', async () => {
    page()
    expect(screen.getByLabelText(/Buscar persona/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Otra Persona/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Agregar nombramiento' }))
    await waitFor(() => expect(createAppointment).toHaveBeenCalledWith(expect.objectContaining({ input: expect.objectContaining({ personId: 9 }) })))
  })

  it('keeps Person read-only on edit and omits personId from PATCH', async () => {
    page()
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(screen.getByRole('dialog', { name: 'Editar nombramiento' })).toBeInTheDocument()
    expect(screen.queryByLabelText(/Buscar persona/)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Persona del nombramiento')).toHaveTextContent('Persona Ficticia')
    fireEvent.change(screen.getByLabelText('Cargo'), { target: { value: 'TREASURER' } })
    fireEvent.change(screen.getByLabelText('Plaza (opcional)'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Desde (opcional)'), { target: { value: '2026-02-01' } })
    fireEvent.change(screen.getByLabelText('Hasta (opcional)'), { target: { value: '2026-11-30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(updateAppointment).toHaveBeenCalledWith({ id: 2, input: { position: 'TREASURER', seatNumber: 2, startsOn: '2026-02-01', endsOn: '2026-11-30' } }))
    expect(updateAppointment.mock.calls[0][0].input).not.toHaveProperty('personId')
  })

  it('closes edit dialog without mutating', () => {
    page()
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog', { name: 'Editar nombramiento' })).not.toBeInTheDocument()
    expect(updateAppointment).not.toHaveBeenCalled()
  })

  it('substitutes an active appointment through one guided mutation', async () => {
    page()
    fireEvent.click(screen.getByRole('button', { name: 'Sustituir' }))
    fireEvent.change(screen.getByLabelText('Finalización del nombramiento anterior'), { target: { value: '2026-12-31' } })
    fireEvent.click(screen.getByRole('button', { name: /Otra Persona/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar sustitución' }))
    await waitFor(() => expect(replaceAppointment).toHaveBeenCalledWith({ id: 2, input: expect.objectContaining({ personId: 9, replacedEndsOn: '2026-12-31' }) }))
  })

  it('opens and confirms revocation with existing mutation contract', async () => {
    page()
    fireEvent.click(screen.getByRole('button', { name: 'Revocar' }))
    expect(screen.getByRole('dialog', { name: 'Revocar nombramiento' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Fecha efectiva de revocación'), { target: { value: '2026-06-30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar revocación' }))
    await waitFor(() => expect(revokeAppointment).toHaveBeenCalledWith({ id: 2, input: { endsOn: '2026-06-30' } }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Revocar nombramiento' })).not.toBeInTheDocument())
  })

  it('keeps revocation dialog open and reports mutation error', async () => {
    revokeAppointment.mockRejectedValueOnce(new Error('No fue posible revocar'))
    page()
    fireEvent.click(screen.getByRole('button', { name: 'Revocar' }))
    fireEvent.change(screen.getByLabelText('Fecha efectiva de revocación'), { target: { value: '2026-06-30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar revocación' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible revocar')
    expect(screen.getByRole('dialog', { name: 'Revocar nombramiento' })).toBeInTheDocument()
  })

  it('closes revocation dialog without mutating', () => {
    page()
    fireEvent.click(screen.getByRole('button', { name: 'Revocar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog', { name: 'Revocar nombramiento' })).not.toBeInTheDocument()
    expect(revokeAppointment).not.toHaveBeenCalled()
  })

  it('keeps board data readable and hides mutation controls without management permission', () => {
    permissionCodes = []
    page()
    expect(screen.getByText('Tiene acceso de consulta. Las modificaciones requieren permiso de administración.')).toBeInTheDocument()
    expect(screen.getByText('Persona Ficticia')).toBeInTheDocument()
    expect(screen.getByText('Presidencia')).toBeInTheDocument()
    expect(screen.queryByText('Nuevo período')).not.toBeInTheDocument()
    expect(screen.queryByText('Agregar nombramiento')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sustituir' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Revocar' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Buscar persona/)).not.toBeInTheDocument()
  })
})
