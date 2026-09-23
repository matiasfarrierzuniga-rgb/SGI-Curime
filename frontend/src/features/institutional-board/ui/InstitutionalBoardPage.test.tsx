import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InstitutionalBoardPage } from './InstitutionalBoardPage'

const createTerm = vi.fn().mockResolvedValue({})
const createAppointment = vi.fn().mockResolvedValue({})
const updateAppointment = vi.fn().mockResolvedValue({})
vi.mock('../hooks/institutionalBoard.queries', () => ({
  useBoardTerms: () => ({ data: [{ id: 1, startsOn: '2026-01-01', endsOn: '2027-12-31', appointments: [{ id: 2, boardTermId: 1, personId: 8, position: 'PRESIDENT', seatNumber: null, startsOn: null, endsOn: null, person: { id: 8, firstName: 'Persona', firstSurname: 'Ficticia', secondSurname: null, legacyFullName: null } }] }], isPending: false, isError: false }),
  usePersonCandidates: () => ({ data: [{ id: 9, displayName: 'Otra Persona', identificationType: 'NATIONAL', identificationHint: '••••0001' }] }),
  useBoardMutations: () => ({ createTerm: { mutateAsync: createTerm, isPending: false }, createAppointment: { mutateAsync: createAppointment, isPending: false }, updateAppointment: { mutateAsync: updateAppointment, isPending: false } }),
}))

describe('InstitutionalBoardPage', () => {
  beforeEach(() => vi.clearAllMocks())
  it('shows periods, history, position labels and no delete or unsupported claims', () => {
    render(<InstitutionalBoardPage />)
    expect(screen.getByRole('heading', { name: 'Junta Directiva' })).toBeInTheDocument()
    expect(screen.getAllByText('Presidencia')).not.toHaveLength(0)
    expect(screen.getByText('Persona Ficticia')).toBeInTheDocument()
    expect(screen.getByText(/Según período/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/DINADECO|sello/i)).not.toBeInTheDocument()
  })
  it('uses the person selector on create and sends personId', async () => {
    render(<InstitutionalBoardPage />)
    expect(screen.getByLabelText(/Buscar persona/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Otra Persona/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Agregar nombramiento' }))
    await waitFor(() => expect(createAppointment).toHaveBeenCalledWith(expect.objectContaining({ input: expect.objectContaining({ personId: 9 }) })))
  })
  it('keeps Person read-only on edit and omits personId from PATCH', async () => {
    render(<InstitutionalBoardPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(screen.queryByLabelText(/Buscar persona/)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Persona del nombramiento')).toHaveTextContent('Persona Ficticia')
    expect(screen.getByText(/Para registrar una sustitución, cierre la vigencia/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Otra Persona/ })).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Cargo'), { target: { value: 'TREASURER' } })
    fireEvent.change(screen.getByLabelText('Plaza (opcional)'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Desde (opcional)'), { target: { value: '2026-02-01' } })
    fireEvent.change(screen.getByLabelText('Hasta (opcional)'), { target: { value: '2026-11-30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(updateAppointment).toHaveBeenCalledWith({ id: 2, input: { position: 'TREASURER', seatNumber: 2, startsOn: '2026-02-01', endsOn: '2026-11-30' } }))
    expect(updateAppointment.mock.calls[0][0].input).not.toHaveProperty('personId')
    expect(screen.getByText('Persona Ficticia')).toBeInTheDocument()
    expect(screen.getByLabelText(/Buscar persona/)).toBeInTheDocument()
  })
})
